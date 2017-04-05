
let container;
//const textBoxes = [];
//const menus = [];

/*class TextBox {
  constructor(text, event) {
    this.text = text;
    this.menu = undefined;
    this.next = undefined;
    this.element = undefined;
    this.event = event;
  }

  display() {
    this.element.innerHTML = `<p>${this.text}</p>`;
    this.element.classList.remove('hidden');
    if (this.event) this.event();
  }

  hide() {
    this.element.classList.add('hidden');
  }

  progress(e) {
    if (this.menu) this.menu.hide();
	    else this.hide();
	    this.next.element.onclick = this.next.progress && this.next.progress.bind(this.next);
    this.next.display();
    return this.next;
  }
}

class Menu {
  constructor() {
    this.options = []; // options are textboxes
	    this.element = document.createElement('div'); // just a container for the menu options
	    this.element.classList.add('menuContainer');
  }

  display() {
    this.options.forEach((el, i) => setTimeout(el.display.bind(el), i * 100));
  }

  hide() {
    this.options.forEach((el, i) => setTimeout(el.hide.bind(el), i * 100));
  }

    // set the value of next for the menu item whose result you want to be this chain
    // to the return value of this function
  createTextBoxChain(textBoxChain) {
    textBoxChain = textBoxChain.map(el => (typeof el === 'string') ? new TextBox(el) : el);
    textBoxChain.forEach((el, i) => {
      el.element = textBoxes[i % 2];
      el.next = textBoxChain[i + 1];
    });
    textBoxChain[textBoxChain.length - 1].next = this;
    return textBoxChain[0];
  }
}

const createTextBoxElement = (visible) => {
  const box = document.createElement('div');
  box.classList.add('textBox');
  if (!visible) box.classList.add('hidden');
  return box;
};

const setupUI = () => {
    // create the elements for the textbox chains; parameter indicates visibility
  textBoxes[0] = createTextBoxElement(false);
  textBoxes[1] = createTextBoxElement(false);

  container.appendChild(textBoxes[0]);
  container.appendChild(textBoxes[1]);
};

const setupMenu = (options, setup) => {
  const menu = new Menu();
  menu.options = options;

  if(setup) setup(menu);

  menu.options.forEach((option) => {
    option.menu = menu;
    option.event = clear;
    option.element = createTextBoxElement(true);
    option.element.onclick = option.progress.bind(option);
    option.display();
  });

  menus.forEach((menuEl) => {
    container.appendChild(menuEl.element);
    menuEl.options.forEach(boxEl => menuEl.element.appendChild(boxEl.element));
  });

  return menu;
};
*/

class Display {
  constructor(element, parent, update, setup) {
    this.element = (typeof(element) === 'string') ? document.createElement(element) : element;
    if(setup) setup(this.element);
    if(parent) {
      this.setParent(parent);
    }
    this.update = update;
  }

  setParent(element) {
    this.parent = element;
    this.parent.appendChild(this.element);
  }
}

const setupUI = () => {
  
};

window.addEventListener('load', () => {
  container = document.getElementById('pop_ups');
  setupUI();
});
