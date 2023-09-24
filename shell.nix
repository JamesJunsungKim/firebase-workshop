{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell {
  buildInputs = [
    nodejs_20
    yarn
  ];

  shellHook = ''
    export PATH="$PATH:$PWD/node_modules/.bin"
    npm install
  '';
}
