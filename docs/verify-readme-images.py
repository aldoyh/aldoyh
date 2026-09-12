#!/usr/bin/env python3
"""Check that every image embedded in the profile README actually loads.

Third-party badge and stat services (vercel.app, herokuapp.com, ...) go down
or get rate-limited without warning, and a dead one shows up on the profile
as a broken-image icon. Requesting those services directly is not a fair
test, because what a visitor's browser actually fetches is GitHub's camo
proxy, not the upstream host.

So this script asks GitHub to render the README, collects the
camo.githubusercontent.com URLs out of the rendered HTML, and fetches those.
Camo streams the upstream response, which means a 502 from camo is a
genuinely dead endpoint rather than a local network problem.

Usage:
    python3 docs/verify-readme-images.py [--ref BRANCH] [--retries N]

Exits 0 if every image returned 200, 1 otherwise.
"""

from __future__ import annotations

import argparse
import binascii
import re
import sys
import urllib.error
import urllib.request
from html import unescape

OWNER, REPO, PATH = "aldoyh", "aldoyh", "README.md"
UA = "readme-image-check (+https://github.com/aldoyh/aldoyh)"
# GitHub serves images from the repo itself un-proxied; everything else is camoed.
IMAGE_HOSTS = ("camo.githubusercontent.com", "raw.githubusercontent.com")


def fetch(url: str, timeout: int = 40) -> tuple[int, str, int]:
    """Return (status, content_type, size). Network errors surface as status 0."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            return resp.status, resp.headers.get("Content-Type", ""), len(body)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get("Content-Type", ""), 0
    except Exception as exc:  # DNS, TLS, timeout, proxy refusal
        print(f"    ! {type(exc).__name__}: {exc}", file=sys.stderr)
        return 0, "", 0


def decode_camo(url: str) -> str:
    """Recover the upstream URL that a camo link points at."""
    tail = url.rsplit("/", 1)[-1].split("?")[0]
    try:
        return binascii.unhexlify(tail).decode("utf-8", "replace")
    except (binascii.Error, ValueError):
        return url


def collect_images(ref: str) -> list[tuple[str, str]]:
    """Return (alt, src) for every rendered image, in document order."""
    blob = f"https://github.com/{OWNER}/{REPO}/blob/{ref}/{PATH}"
    req = urllib.request.Request(blob, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", "replace")

    found = []
    for tag in re.findall(r"<img\b[^>]*>", html):
        # Must not match data-canonical-src, which holds the un-proxied URL.
        src = re.search(r'(?<![-\w])src="([^"]+)"', tag)
        if not src:
            continue
        url = unescape(src.group(1))
        if not url.startswith(("http://", "https://")):
            continue
        if not any(host in url for host in IMAGE_HOSTS):
            continue
        alt = re.search(r'alt="([^"]*)"', tag)
        found.append((unescape(alt.group(1)) if alt else "(no alt)", url))

    # De-duplicate while preserving order; the same badge can appear twice.
    seen, unique = set(), []
    for alt, url in found:
        if url not in seen:
            seen.add(url)
            unique.append((alt, url))
    return unique


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", default="main", help="branch, tag or SHA (default: main)")
    parser.add_argument("--retries", type=int, default=2,
                        help="attempts per image before calling it dead (default: 2)")
    args = parser.parse_args()

    images = collect_images(args.ref)
    print(f"Checking {len(images)} images in {OWNER}/{REPO}@{args.ref}\n")

    failures = []
    for alt, url in images:
        upstream = decode_camo(url) if "camo." in url else url
        for attempt in range(1, args.retries + 1):
            status, ctype, size = fetch(url)
            if status == 200:
                break
        mark = "ok  " if status == 200 else "FAIL"
        detail = f"{status} {ctype.split(';')[0]:<14} {size:>7}B" if status == 200 else f"{status}"
        print(f"{mark} {detail:<32} {alt[:38]:<40} {upstream[:72]}")
        if status != 200:
            failures.append((alt, upstream, status))

    print()
    if failures:
        print(f"{len(failures)} of {len(images)} images are broken:\n")
        for alt, upstream, status in failures:
            print(f"  [{status}] {alt} -> {upstream}")
        return 1
    print(f"All {len(images)} images returned 200.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
