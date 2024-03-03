# ZotReg
Make WebReg bearable to use.

# Setup
```cmd
npm install
npm run build
```

Open Firefox and navigate to `about:debugging` -> This Firefox -> Load Temporary Add-On...
Select the `manifest.json` file in the build directory and import it
Make sure to enable the permissions for `reg.uci.edu` in the extension under `about:addons` as well (this isn't on by default in Manifest v3 for some reason)
