#!/usr/bin/env sh
# Fake installer used by unit tests. Mirrors the real installer's contract:
# logs on stderr, key=value result on stdout.
set -eu

version="latest"
install_root=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version) version="$2"; shift 2 ;;
    --install-root) install_root="$2"; shift 2 ;;
    *) shift ;;
  esac
done

[ -n "$install_root" ] || { echo "install.sh: missing --install-root" >&2; exit 1; }
[ "$version" != "latest" ] || version="9.9.9"

if [ "${FAKE_INSTALLER_FAIL:-}" = "1" ]; then
  echo "install.sh: simulated failure" >&2
  exit 1
fi

echo "install.sh: fake install of $version" >&2
printf 'version=%s\n' "$version"
printf 'target=%s\n' "testos-x86_64"
printf 'bin_dir=%s\n' "$install_root/$version/testos-x86_64/cloudsmith"
printf 'executable=%s\n' "$(cd "$(dirname "$0")" && pwd)/cloudsmith"
