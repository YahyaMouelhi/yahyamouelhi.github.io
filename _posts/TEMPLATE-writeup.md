---
# =============================================================
#  WRITEUP TEMPLATE — copy & rename for every new post
#  filename: _posts/YYYY-MM-DD-challenge-name.md
# =============================================================

title:      "Challenge Name — Platform"
date:       2025-01-01 20:00:00 +0100
categories: [pwn, hackthebox]        # [CATEGORY, platform]  category options: pwn | web | rev | crypto | forensics | misc
tags:       [tag1, tag2, tag3]       # lowercase, relevant tools/techniques
pin:        false                    # set true to pin to top of home
toc:        true
description: >-
  One or two sentence summary for SEO and post card preview.
---

## challenge info

| field      | value             |
|------------|-------------------|
| platform   | HackTheBox        |
| category   | pwn               |
| difficulty | hard              |
| points     | 500               |
| tools      | pwntools, gdb     |

---

## recon

```bash
$ file ./chal
$ checksec ./chal
```

---

## analysis



---

## exploit

```python
from pwn import *
```

---

## flag

```
FLAG{...}
```
