const { invoke } = window.__TAURI__.core;
const { event, window: tauriWindow, path } = window.__TAURI__;
const { open, message } = window.__TAURI__.dialog;
//const { message } = require('@tauri-apps/plugin-dialog')

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function openMD() {

  try{

    const filename = await open({
      multiple: false,
      directory: false,
    });

    let mdcontent = await invoke("read_markdown_file", { filename: filename })

    const converter = new showdown.Converter(),
      
      html      = converter.makeHtml(mdcontent);

    document.getElementById('markdown').innerHTML = html

    document.getElementById('debug').textContent = await path.appDataDir()

    document.getElementById('moreinfo').textContent = filename

  }
  catch(err){

    document.getElementById('debug').textContent = `${err}`
  }
}

async function viewMD() {

  try{
    let filename = document.getElementById('mdfile').value

    let mdcontent = await invoke("read_markdown_file", { filename: filename })

    const converter = new showdown.Converter(),
      //text      = '# hello, markdown!',
      html      = converter.makeHtml(mdcontent);

    document.getElementById('markdown').innerHTML = html
    document.getElementById('debug').textContent = "test" //filename
  }
  catch(err){

    document.getElementById('debug').textContent = `${err} ${document.getElementById('mdfile').value}`

  }
}

async function testDialog(){

  await message('Just a test', { title: 'Tauri', kind: 'info' });
}

window.addEventListener("DOMContentLoaded", () => {

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  
  //document.getElementById('moreinfo').innerHTML = JSON.stringify(window)
  //openMD()

  document.getElementById('testdialog').addEventListener("click", (e) => {

    //testDialog()
    openMD()
  })

  document.getElementById('mdfile').addEventListener("change", (e) => {

    document.getElementById('filedata').textContent = document.getElementById('mdfile').value  //JSON.stringify( document.getElementById('mdfile').files)
  });

  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    //greet();
    viewMD()
    
    
  });
});
