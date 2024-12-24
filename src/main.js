const { invoke } = window.__TAURI__.core;
const { exists, BaseDirectory, readTextFile } = window.__TAURI__.fs;
const { open, message } = window.__TAURI__.dialog;
const { load } = window.__TAURI__.store;

let openedFile

const targetEl = 'markdown'

let history = []

let store

let greetInputEl;
let greetMsgEl;

async function errorMessage(err){

  await message(err, { title: 'Oops...', kind: 'error' });
}

async function storeFileName(fname){

  //const store = await load('store.json', { autoSave: false });

  await store.set('lastfile', fname);

  await store.save();
}

async function getStoreData(){

  //const store = await load('store.json', { autoSave: false });

  return await store.get('lastfile')
}

function showHistory(){

  document.getElementById(targetEl).innerHTML = history.map((row,indx)=>{
                                                                      return `<p><a id="hlnk-${indx}" href="#" class="history-item" data-filename="${row}">${row}</a></p>`
                                                                    }).join('')

  let hitems = document.querySelectorAll('.history-item')
  
  hitems.forEach((item)=>{

    item.addEventListener('click',(e)=>{

      e.preventDefault();

      try{

        const el = e.currentTarget

        loadMD(el.dataset.filename)

        //document.getElementById('debug').textContent = `Go back to: ${el.dataset.filename}`
        /* (async()=>{
          await message(`You clicked on: `, { title: 'History', kind: 'info' });  // ${el.dataset.filename}
        })() */
      }
      catch(err){

        errorMessage(err)
      }
      
    })

  })
}

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

async function loadMD(fname) {

  let mdcontent = await readTextFile(fname)
      
  let html = marked.parse(mdcontent);

  document.getElementById(targetEl).innerHTML = html

  history.push(fname)

  storeFileName(fname)
}

async function openMD() {

  try{

    const filename = await open({
      multiple: false,
      directory: false,
    });

    loadMD(filename)

    //let mdcontent = await readTextFile(filename)
    //let html = marked.parse(mdcontent);
    //document.getElementById(targetEl).innerHTML = html
    //document.getElementById('debug').textContent = await path.appDataDir()

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

    document.getElementById(targetEl).innerHTML = html
    document.getElementById('debug').textContent = "test" //filename
  }
  catch(err){

    document.getElementById('debug').textContent = `${err} ${document.getElementById('mdfile').value}`

  }
}

async function testDialog(){

  let stored = getStoreData()

  if(typeof(stored) == "string"){

    await message(`Stored filename (str): ${getStoreData()}`, { title: 'Tauri', kind: 'info' });
  }
  else if(typeof(stored) == "object"){

    await message(`Stored filename (obj): ${JSON.stringify(stored)}`, { title: 'Tauri', kind: 'info' });
  }
  else{

    await message(`Error: Could not get stored data`, { title: 'Tauri', kind: 'error' });
  }
  
}

window.addEventListener("DOMContentLoaded", () => {

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");

  (async()=>{

    store = await load('store.json', { autoSave: false });

  })()
  
  document.getElementById('testdialog').addEventListener("click", (e) => {

    //testDialog()
    openMD()
  })

  document.getElementById('nav-about').addEventListener("click", async (e) => {

    await message(`Created by Amir Hachaichi\nUses marked\ngithub.com/amirlogic/tauri-apps-vanilla-js`, { title: 'About', kind: 'info' });

  })

  document.getElementById('nav-history').addEventListener("click", (e) => {

    showHistory()

  })

  document.getElementById('nav-test').addEventListener("click", (e) => {

    testDialog()

    //await message(``, { title: 'About', kind: 'info' });

  })

  document.getElementById('nav-clear').addEventListener("click", (e) => {

    document.getElementById(targetEl).innerHTML = ""

  })

  document.getElementById('mdfile').addEventListener("change", (e) => {

    document.getElementById('filedata').textContent = document.getElementById('mdfile').value 

  });

  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    //greet();
    //viewMD()
    testDialog()
    
  });
});
