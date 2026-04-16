const { invoke } = window.__TAURI__.core;
const { exists, readTextFile, readFile } = window.__TAURI__.fs;
const { getVersion } = window.__TAURI__.app
const { join, dirname, extname } = window.__TAURI__.path;
const { Menu, MenuItem, Submenu } = window.__TAURI__.menu;

const { open, message } = window.__TAURI__.dialog;
const { Command } = window.__TAURI__.shell;
const { openPath } = window.__TAURI__.opener;
const { getCurrent } = window.__TAURI__.deepLink;
const { getMatches } = window.__TAURI__.cli;

let openedFile;
const targetEl = 'markdown';

let history = [];
let menu;

// ---------------- ERROR ----------------
async function errorMessage(err){
  await message(err, { title: 'Oops...', kind: 'error' });
}

// ---------------- RECENT MENU ----------------
async function updateRecentMenu(){
  const recentMenu = await menu.get('recent');

  history.forEach(async (hitem, indx) => {
    const recentItem = await recentMenu.get(`r${indx}`);
    if (recentItem) {
      await recentItem.setText(hitem);
    }
  });
}

// ---------------- LOAD MARKDOWN ----------------
async function loadMD(fname) {
  try{
    let mdcontent = await readTextFile(fname);
    let html = marked.parse(mdcontent);

    document.getElementById(targetEl).innerHTML = html;

    // ---- NEW RECENT LOGIC ----
    if (history.indexOf(fname) === -1) {
      history.splice(0, 0, fname);
      if (history.length > 10) history.pop();
      updateRecentMenu();
    }

    openedFile = fname;
    document.getElementById('opened-file').innerText = fname;
  }
  catch(err){
    errorMessage(err);
  }

  try{
    const filedir = await dirname(fname);

    // ---- HANDLE LINKS ----
    const mdlinks = document.querySelectorAll("a[href]");
    mdlinks.forEach((lnk) => {
      lnk.addEventListener("click", async (e)=>{
        e.preventDefault();

        try{
          if(lnk?.href.indexOf('http') === 0 ){
            if(lnk.href.indexOf('.md') !== -1 ){
              const url = new URL(lnk.href);
              const targetmd = await join(filedir, decodeURI(url.pathname));
              await loadMD(targetmd);
            } else {
              await message("Right-click to copy link", { title: 'link', kind: 'info' });
            }
          }
        }
        catch(err){
          errorMessage(err);
        }
      }, false);
    });

    // ---- HANDLE IMAGES ----
    const imgs = document.querySelectorAll("img");

    imgs.forEach(async (img) => {
      try{
        const url = new URL(img.src);

        if(url.host === "127.0.0.1:1430" || url.host === "tauri.localhost"){
          const localimg = await join(filedir, decodeURI(url.pathname));
          const fileExists = await exists(localimg);

          if(fileExists){
            const imgbytes = await readFile(localimg);

            const base64String = btoa(
              Array.from(imgbytes)
                .map(byte => String.fromCharCode(byte))
                .join('')
            );

            const imgext = await extname(localimg);
            img.src = `data:image/${imgext};base64,${base64String}`;
          } else {
            img.alt = "Image NOT found!";
          }
        } else {
          img.alt = url;
        }
      }
      catch(err){
        errorMessage(err);
      }
    });
  }
  catch(err){
    errorMessage(err);
  }
}

// ---------------- OPEN FILE ----------------
async function openMD() {
  try{
    const filename = await open({
      multiple: false,
      directory: false,
      extensions: ['md']
    });

    if(filename){
      loadMD(filename);
    }
  }
  catch(err){
    errorMessage(err);
  }
}

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {

  (async ()=>{
    try{
      const fileMenu = await Submenu.new({
        text: 'File',
        items: [
          await MenuItem.new({
            id: 'open',
            text: 'Open',
            action: () => openMD(),
          }),
          await MenuItem.new({
            id: 'reload',
            text: 'Reload',
            action: () => loadMD(openedFile),
          }),
          await MenuItem.new({
            id: 'edit',
            text: 'Edit',
            action: async () => {
              try{
                await openPath(openedFile);
              }
              catch(err){
                await Command.create('notepad', [openedFile]).execute();
              }
            },
          }),
          await MenuItem.new({
            id: 'print',
            text: 'Print',
            action: () => window.print(),
          }),
          await MenuItem.new({
            id: 'clear',
            text: 'Clear',
            action: () => {
              document.getElementById(targetEl).innerHTML = "";
              openedFile = "";
            },
          }),
        ]
      });

      // -------- NEW RECENT MENU --------
      const recent_menu = {
        id: 'recent',
        text: 'Recent',
        items: [
          { id: 'r0', text:'-', action:()=> loadMD(history[0]) },
          { id: 'r1', text:'-', action:()=> loadMD(history[1]) },
          { id: 'r2', text:'-', action:()=> loadMD(history[2]) },
          { id: 'r3', text:'-', action:()=> loadMD(history[3]) },
          { id: 'r4', text:'-', action:()=> loadMD(history[4]) },
          { id: 'r5', text:'-', action:()=> loadMD(history[5]) },
          { id: 'r6', text:'-', action:()=> loadMD(history[6]) },
          { id: 'r7', text:'-', action:()=> loadMD(history[7]) },
          { id: 'r8', text:'-', action:()=> loadMD(history[8]) },
          { id: 'r9', text:'-', action:()=> loadMD(history[9]) },
        ]
      };

      const helpMenu = await Submenu.new({
        text: 'Help',
        items: [
          await MenuItem.new({
            id: 'about',
            text: 'About',
            action: async () => {
              await message(
                `Markdown Viewer v${appVersion}\nCreated by Amir Hachaichi\nUses Marked\ngithub.com/amirlogic/tauri-markdown-viewer`,
                { title: 'About', kind: 'info' }
              );
            },
          }),
        ]
      });

      menu = await Menu.new({
        items: [
          fileMenu,
          recent_menu,
          helpMenu
        ],
      });

      await menu.setAsAppMenu();
    }
    catch(err){
      errorMessage(err);
    }
  })();

  // ---------------- CLI OPEN ----------------
  (async ()=>{
    const matches = await getMatches();

    try{
      if (matches.args?.file?.value) {
        let filePath = matches.args.file.value.trim();

        if(filePath.includes('\\\\')){
          filePath = await join(...filePath.split('\\\\'));
        } else {
          filePath = await join(...filePath.split('\\'));
        }

        const fileExists = await exists(filePath);

        if(fileExists){
          await loadMD(filePath);
        } else {
          document.getElementById(targetEl).innerText = `File not found: ${filePath}`;
          errorMessage("File not found");
        }
      }
    }
    catch(err){
      errorMessage(err);
    }
  })();
});
