// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function convertDashToCamel(str) {
    return str.replace(/-([a-z0-9])/g, (g)=>g[1].toUpperCase()
    );
}
function convertCamelToDash(str) {
    return str.replace(/([a-zA-Z0-9])(?=[A-Z])/g, "$1-").toLowerCase();
}
function createTemplate(html1) {
    const template = document.createElement("template");
    template.innerHTML = html1;
    return template;
}
function stringify(input) {
    return typeof input === "string" ? input : typeof input === "number" ? input.toString() : "";
}
function isString(input) {
    return typeof input === "string";
}
function isNull(input) {
    return input === null;
}
function isTrue(input) {
    return input === true;
}
function isObject(obj) {
    return obj !== null && typeof obj === "object" && Array.isArray(obj) === false;
}
class ShadowError extends Error {
    constructor(message){
        super(message);
        this.message = message;
        this.name = this.constructor.name;
    }
}
class Shadow extends HTMLElement {
    _renderingCount = 0;
    _waitingList = new Set();
    _accessorsStore = new Map();
    _updateCustomEvent = new CustomEvent("_updated");
    _propertiesAndOptions;
    _dynamicCssStore = [];
    _isConnected = false;
    _isPaused = false;
    root;
    dom = {
        id: {},
        class: {}
    };
    initUrl = null;
    get _isReady() {
        return this._isConnected === true && this._isPaused === false && this._waitingList.size === 0;
    }
    constructor(options = {
        mode: "open"
    }){
        super();
        this.root = this.attachShadow(options);
        this._propertiesAndOptions = this.__propertiesAndOptions || [];
        if (this.firstUpdated) {
            this.addEventListener("_updated", this.firstUpdated, {
                once: true
            });
        }
        if (this.updated) {
            this.addEventListener("_updated", this.updated);
        }
    }
    connectedCallback() {
        this.init(this._propertiesAndOptions);
    }
    init(propertiesAndOptions) {
        propertiesAndOptions.push({
            property: "initUrl",
            render: false
        });
        propertiesAndOptions.forEach(this._makePropertyAccessible);
        this._isConnected = true;
        if (isTrue(this._isReady)) {
            this._actuallyRender();
        }
    }
    _makePropertyAccessible = ({ property: property1 , reflect =true , render =true , wait =false , assert =false  })=>{
        if (isTrue(wait)) {
            this._waitingList.add(property1);
        } else if (isTrue(assert) && !this[property1]) {
            throw new ShadowError(`The property ${property1} must have a truthy value.`);
        }
        this._accessorsStore.set(property1, this[property1]);
        if (isTrue(reflect)) {
            this._updateAttribute(property1, this[property1]);
        }
        Object.defineProperty(this, property1, {
            get: ()=>this._accessorsStore.get(property1)
            ,
            set: (value)=>{
                if (isTrue(assert) && !value) {
                    throw new ShadowError(`The property '${property1}' must have a truthy value.`);
                }
                this._accessorsStore.set(property1, value);
                if (isTrue(wait)) {
                    this._waitingList.delete(property1);
                }
                if (isTrue(reflect)) {
                    this._updateAttribute(property1, value);
                }
                if (isTrue(render) && isTrue(this._isReady)) {
                    this._actuallyRender();
                }
            }
        });
    };
    _updateAttribute(property2, value) {
        const attributeName = convertCamelToDash(property2);
        const attributeValue = this.getAttribute(attributeName);
        if (attributeValue !== value) {
            if (isNull(value)) return this.removeAttribute(attributeName);
            else {
                if (isString(value)) {
                    this.setAttribute(attributeName, value);
                } else {
                    const jsonValue = JSON.stringify(value);
                    if (jsonValue === undefined) {
                        throw new ShadowError(`Only JSON values can be reflected in attributes but received ` + `the value '${value}' for '${property2}'.`);
                    }
                    if (attributeValue !== jsonValue) {
                        this.setAttribute(attributeName, jsonValue);
                    }
                }
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue === oldValue) {
            return undefined;
        } else if (name === "init-url" && isString(newValue)) {
            this._isPaused = true;
            this.update(name, newValue);
            this._fetchJsonAndUpdate(newValue).then(()=>{
                this._isPaused = false;
                if (isTrue(this._isReady)) {
                    this._actuallyRender();
                }
            });
        } else {
            return this.update(name, newValue);
        }
    }
    _fetchJsonAndUpdate(urlOrPath) {
        return fetch(new URL(urlOrPath, location.href).href).then((res)=>{
            if (isTrue(res.ok)) {
                return res.json().then((data)=>Object.entries(data).forEach(([property3, value])=>this[property3] = value
                    )
                );
            } else {
                throw new ShadowError(`Received status code ${res.status} instead of 200-299 range.`);
            }
        }).catch((err)=>{
            throw new ShadowError(err.message);
        });
    }
    update(name, value) {
        const property4 = convertDashToCamel(name);
        if (property4 in this) {
            if (this[property4] !== value && JSON.stringify(this[property4]) !== value) {
                try {
                    this[property4] = isNull(value) ? value : JSON.parse(value);
                } catch  {
                    this[property4] = value;
                }
            }
        } else {
            throw new ShadowError(`The property '${property4}' does not exist on '${this.constructor.name}'.`);
        }
    }
    addCss(ruleSet, render = false) {
        this._dynamicCssStore.push(createTemplate(`<style>${ruleSet}</style>`));
        if (isTrue(render) && isTrue(this._isReady)) this._actuallyRender();
    }
    _createFragment(...inputArray) {
        const documentFragment = document.createDocumentFragment();
        inputArray.flat(2).forEach((input)=>{
            if (isObject(input) && input.element instanceof Element) {
                const { element , collection  } = input;
                documentFragment.appendChild(element);
                collection.forEach(({ target , queries , eventsAndListeners  })=>{
                    queries.forEach(({ kind , selector  })=>kind === "id" ? this.dom.id[selector] = target : this.dom.class[selector] ? this.dom.class[selector].push(target) : this.dom.class[selector] = [
                            target
                        ]
                    );
                    eventsAndListeners.forEach(({ event , listener  })=>target.addEventListener(event, listener.bind(this))
                    );
                });
            } else if (isString(input)) {
                documentFragment.appendChild(createTemplate(input).content.cloneNode(true));
            } else {
                documentFragment.appendChild(document.createTextNode(stringify(input)));
            }
        });
        return documentFragment;
    }
    _actuallyRender() {
        if (this._renderingCount > 0) {
            this.dom.id = {};
            this.dom.class = {};
        }
        while(this.root.firstChild){
            this.root.removeChild(this.root.firstChild);
        }
        this.constructor.styles.forEach((template)=>this.root.append(template.content.cloneNode(true))
        );
        if (this._dynamicCssStore.length > 0) {
            this._dynamicCssStore.forEach((styleTemplate)=>this.root.append(styleTemplate.content.cloneNode(true))
            );
        }
        this.root.prepend(this._createFragment(this.render()));
        this.dispatchEvent(this._updateCustomEvent);
        this._renderingCount++;
    }
    render() {
        return "";
    }
    static styles = [];
    static is;
}
function __default(n1) {
    for(var l, e, s = arguments, t = 1, r = "", u = "", a = [
        0
    ], c = function(n) {
        1 === t && (n || (r = r.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? a.push(n ? s[n] : r) : 3 === t && (n || r) ? (a[1] = n ? s[n] : r, t = 2) : 2 === t && "..." === r && n ? a[2] = Object.assign(a[2] || {}, s[n]) : 2 === t && r && !n ? (a[2] = a[2] || {})[r] = !0 : t >= 5 && (5 === t ? ((a[2] = a[2] || {})[e] = n ? r ? r + s[n] : s[n] : r, t = 6) : (n || r) && (a[2][e] += n ? r + s[n] : r)), r = "";
    }, h1 = 0; h1 < n1.length; h1++){
        h1 && (1 === t && c(), c(h1));
        for(var i = 0; i < n1[h1].length; i++)l = n1[h1][i], 1 === t ? "<" === l ? (c(), a = [
            a,
            "",
            null
        ], t = 3) : r += l : 4 === t ? "--" === r && ">" === l ? (t = 1, r = "") : r = l + r[0] : u ? l === u ? u = "" : r += l : '"' === l || "'" === l ? u = l : ">" === l ? (c(), t = 1) : t && ("=" === l ? (t = 5, e = r, r = "") : "/" === l && (t < 5 || ">" === n1[h1][i + 1]) ? (c(), 3 === t && (a = a[0]), t = a, (a = a[0]).push(this.apply(null, t.slice(1))), t = 0) : " " === l || "\t" === l || "\n" === l || "\r" === l ? (c(), t = 2) : r += l), 3 === t && "!--" === r && (t = 4, a = a[0]);
    }
    return c(), a.length > 2 ? a.slice(1) : a[1];
}
const SVG_NS = "http://www.w3.org/2000/svg";
function isArrayOfListeners(input) {
    return input.every((i)=>typeof i === "function"
    );
}
function isSpecialKey(input) {
    return input === "id" || input === "class";
}
function isHReturn(input) {
    return isObject(input) && input.element instanceof Element;
}
function h(type, props, ...children) {
    const eventsAndListeners = [];
    const queries = [];
    const collection = [];
    const element = type === "svg" ? document.createElementNS(SVG_NS, "svg") : document.createElement(type);
    for(const key in props){
        if (typeof props[key] === "function") {
            eventsAndListeners.push({
                event: key,
                listener: props[key]
            });
        } else if (Array.isArray(props[key]) && isArrayOfListeners(props[key])) {
            props[key].forEach((listener)=>eventsAndListeners.push({
                    event: key,
                    listener
                })
            );
        } else if (key[0] === "@") {
            const idOrClass = key.slice(1);
            if (isSpecialKey(idOrClass)) {
                queries.push({
                    kind: idOrClass,
                    selector: props[key].replace(/ .*/, "")
                });
                element.setAttribute(idOrClass, props[key]);
            }
        } else if (props[key] === true) {
            element.setAttribute(key, "");
        } else if (typeof props[key] === "object" && props[key] !== null) {
            element.setAttribute(key, JSON.stringify(props[key]));
        } else if (typeof props[key] === "string") {
            element.setAttribute(key, props[key]);
        } else if (props[key] === null || props[key] === false || props[key] === undefined) {
            element.removeAttribute(key);
        }
    }
    if (type === "svg") {
        element.innerHTML = children.flat(2).reduce((acc, child)=>{
            return acc + (isHReturn(child) ? child.element.outerHTML : stringify(child));
        }, "");
    } else {
        for (const child of children.flat(2)){
            if (isHReturn(child)) {
                collection.push(...child.collection);
                element.appendChild(child.element);
            } else {
                const str = stringify(child);
                if (str) element.appendChild(document.createTextNode(str));
            }
        }
    }
    if (queries.length || eventsAndListeners.length) {
        collection.push({
            target: element,
            queries,
            eventsAndListeners
        });
    }
    return {
        element,
        collection
    };
}
const html = __default.bind(h);
function css(strings, ...values) {
    const cssTemplates = [];
    cssTemplates.push(createTemplate(`<style>${values.reduce((acc, value, i)=>{
        if (value instanceof HTMLTemplateElement) {
            cssTemplates.push(value);
            return acc + strings[i + 1];
        } else if (Array.isArray(value)) {
            value.forEach((el)=>cssTemplates.push(el)
            );
            return acc + strings[i + 1];
        } else {
            return acc + value + strings[i + 1];
        }
    }, strings[0])}</style>`));
    return cssTemplates;
}
function customElement(tagName) {
    return (clazz)=>{
        Object.defineProperty(clazz, "is", {
            value: tagName
        });
        window.customElements.define(tagName, clazz);
        return clazz;
    };
}
function property({ reflect =true , render =true , wait =false , assert =false  } = {}) {
    return (protoOrDescriptor, name)=>{
        if (protoOrDescriptor.constructor.observedAttributes === undefined) {
            protoOrDescriptor.constructor.observedAttributes = [];
        }
        if (reflect === true) {
            protoOrDescriptor.constructor.observedAttributes.push(convertCamelToDash(name));
        }
        if (protoOrDescriptor.__propertiesAndOptions === undefined) {
            Object.defineProperty(protoOrDescriptor, "__propertiesAndOptions", {
                enumerable: false,
                configurable: true,
                writable: false,
                value: []
            });
        }
        protoOrDescriptor.__propertiesAndOptions.push({
            property: name,
            reflect,
            render,
            wait,
            assert
        });
    };
}
function changeInlineStyles(element, [property5, value]) {
    if (property5.slice(0, 2) === "--" && element.style.getPropertyValue(property5) !== value) {
        element.style.setProperty(property5, value);
    } else if (element.style[property5] !== value) {
        element.style[property5] = value;
    }
}
function changeCss(styles, ...elements) {
    Object.entries(styles).forEach((entry)=>elements.forEach((element)=>changeInlineStyles(element, entry)
        )
    );
}
function _applyDecoratedDescriptor(target, property6, decorators, descriptor, context) {
    var desc1 = {};
    Object.keys(descriptor).forEach(function(key) {
        desc1[key] = descriptor[key];
    });
    desc1.enumerable = !!desc1.enumerable;
    desc1.configurable = !!desc1.configurable;
    if ("value" in desc1 || desc1.initializer) {
        desc1.writable = true;
    }
    desc1 = decorators.slice().reverse().reduce(function(desc, decorator) {
        return decorator ? decorator(target, property6, desc) || desc : desc;
    }, desc1);
    var hasAccessor = Object.prototype.hasOwnProperty.call(desc1, "get") || Object.prototype.hasOwnProperty.call(desc1, "set");
    if (context && desc1.initializer !== void 0 && !hasAccessor) {
        desc1.value = desc1.initializer ? desc1.initializer.call(context) : void 0;
        desc1.initializer = undefined;
    }
    if (hasAccessor) {
        delete desc1.writable;
        delete desc1.initializer;
        delete desc1.value;
    }
    if (desc1.initializer === void 0) {
        Object.defineProperty(target, property6, desc1);
        desc1 = null;
    }
    return desc1;
}
function _initializerDefineProperty(target, property7, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property7, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}
var _class, _descriptor, _dec;
const readingMethods = new Set([
    "readAsBinaryString",
    "readAsDataURL",
    "readAsText", 
]);
function changeSelectColor(event) {
    changeCss({
        color: "inherit"
    }, event.target);
}
function validFileType(file, fileType) {
    return fileType.split(",").map((s)=>s.trim()
    ).includes(file.type);
}
var _dec1 = customElement("labeled-controls");
_class = _dec1(((_class = class LabeledControls extends Shadow {
    inputFile = null;
    static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      color: var(--labeledControlsColor, var(--neutralVeryDark, #425466));
      --labeledControlsInputBackground: #f6f9fc;
      --labeledControlsPlaceholderColor: #8898aa;
      line-height: 25px;
      font-size: 17.5px;
    }
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    .group {
      display: flex;
      flex-direction: column;
    }
    .group ~ .group {
      margin-top: 2px;
    }
    .group:not(:last-of-type) {
      margin-bottom: 2px;
    }

    @media (max-width: 640px) {
      .group:first-of-type label {
        padding-top: 0;
      }
    }

    .multi {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .multi label {
      width: 100%;
    }

    .multi input {
      max-width: 48.5%;
    }
    .multi input:last-of-type {
      margin-left: 3%;
    }

    .colorInherit {
      color: inherit !important;
    }

    label {
      display: block;
      padding-top: 8px;
      color: var(--labeledControlsLabelColor, inherit);
      font-size: var(--labeledControlsFontSize, 14px);
      font-weight: var(--labeledControlsLabelFontWeight, 500);
      text-align: start;
    }

    input,
    textarea,
    select {
      display: block;
      font: inherit;
      font-size: var(--labeledControlsFontSize, inherit);
      font-weight: var(--labeledControlsInputFontWeight, 400);
      color: var(--labeledControlsInputColor, inherit);
      padding: var(--labeledControlsInputPadding, 5px 20px 8px 13px);
      outline: none;
      box-shadow: var(--labeledControlsInputBoxShadow, none);
      border: none;
      border-radius: 6px;
      margin-left: auto;
      margin-right: 0;
      width: var(--labeledControlsInputWidthS, 100%);
      max-width: var(--labeledControlsInputMaxWidthS, 100%);
      height: var(--labeledControlsInputHeightS, auto);
      transition: background-color 0.1s ease-in, color 0.1s ease-in;
      background: var(--labeledControlsInputBackground);
      /** remove the blue background button on click  */
      -webkit-tap-highlight-color: transparent;
    }

    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible {
      box-shadow: var(
        --labeledControlsFocusVisibleBoxShadow,
        0 0 0 1px #e4effa
      );
      background: var(--labeledControlsFocusVisibleBackground, transparent);
    }
    input:focus-visible,
    textarea:focus-visible {
      color: var(
        --labeledControlsFocusVisibleColor,
        var(--labeledControlsPlaceholderColor)
      );
    }

    input {
      accent-color: var(--labeledControlsInputAccentColor, var(--accentColor));
    }

    textarea {
      min-height: 90px;
    }

    option {
      padding: 0;
      margin: 0;
      width: 100%;
    }

    select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23424770' fill-rule='evenodd' d='M573.888889,46.3409091 C573.444444,45.8863636 572.777778,45.8863636 572.333333,46.3409091 C571.888889,46.7954545 571.888889,47.4772727 572.333333,47.9318182 L575.333333,51 L572.333333,54.0681818 C571.888889,54.5227273 571.888889,55.2045455 572.333333,55.6590909 C572.555556,55.8863636 572.888889,56 573.111111,56 C573.444444,56 573.666667,55.8863636 573.888889,55.6590909 L577.666667,51.7954545 C578.111111,51.3409091 578.111111,50.6590909 577.666667,50.2045455 L573.888889,46.3409091 Z' transform='rotate(90 314 -258)'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-size: 10px 6px;
      background-position-x: calc(100% - 22px);
      background-position-y: 16px;
      color: var(--selectFirstColor, var(--labeledControlsPlaceholderColor));
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--labeledControlsPlaceholderColor);
      /** https://stackoverflow.com/questions/19621306/css-placeholder-text-color-on-firefox */
      opacity: 1;
    }

    .group *:disabled {
      cursor: not-allowed;
    }

    input[type="button"] {
      cursor: pointer;
    }

    input[type="checkbox"] {
      width: 26px;
      height: 24px;
      cursor: pointer;
    }

    input[type="date"] {
      color: var(--labeledControlsPlaceholderColor);
    }

    input::-webkit-calendar-picker-indicator {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 24 24"><path fill="%23424770" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>');
    }

    input[type="color"] {
      cursor: pointer;
    }
    input::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    input::-webkit-color-swatch {
      border: none;
      box-shadow: 0px 0px 0px 1px #adbdcc;
      border-radius: 6px;
    }
    input::-moz-color-swatch {
      border: none;
      box-shadow: 0px 0px 0px 1px #adbdcc;
      border-radius: 6px;
    }

    input[type="file"] {
      cursor: pointer;
    }

    input::file-selector-button {
      display: none;
    }

    .visuallyHidden {
      border: 0;
      clip: rect(0 0 0 0);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      width: 1px;
    }

    @media (min-width: 640px) {
      .group {
        flex-direction: row;
      }
      .group ~ .group {
        margin-top: 8px;
      }
      .multi {
        flex-wrap: nowrap;
      }
      .multi label {
        width: auto;
      }
      .multi input,
      .multi select {
        max-width: 33.8%;
      }
      .multi input:last-of-type,
      .multi select:last-of-type {
        margin-left: 1.4%;
      }
      label {
        margin-right: 16px;
        padding: var(--labeledControlsLabelPadding, 5px 0 8px);
        font-size: inherit;
      }
      input,
      textarea,
      select {
        max-width: var(--labeledControlsInputMaxWidthM, 69%);
        width: var(--labeledControlsInputWidthM, 100%);
      }
      textarea {
        min-height: 140px;
      }
    }
  `;
    createLabeledControls({ kind , id , label , attr: attr1 = {} , options =[] , isVisuallyHidden , hasFirstSelectedDisabled  }) {
        return kind === "input" ? html` <label
            for="${id}"
            class="inputLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <input
            id="${id}"
            @class="control"
            name="${id}"
            ...${attr1}
            part="input ${id}"
          />` : kind === "textarea" ? html`<label
            for="${id}"
            class="textareaLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <textarea
            id="${id}"
            name="${id}"
            @class="control"
            ...${attr1}
            part="textarea ${id}"
          />` : kind === "select" ? html`<label
            for="${id}"
            class="selectLabel${isVisuallyHidden ? " visuallyHidden" : ""}"
            part="label ${id + "Label"}"
            >${label}</label
          >
          <select
            id="${id}"
            @class="control"
            name="${id}"
            ...${attr1}
            part="select ${id}"
            change="${changeSelectColor}"
          >
            ${options.map(({ data , attr ={}  }, i)=>hasFirstSelectedDisabled ? i === 0 ? html`<option
                      ...${{
                selected: "",
                disabled: "",
                ...attr
            }}
                      part="option"
                    >
                      ${data}
                    </option>` : html`<option ...${attr} part="option">${data}</option>` : html`<option ...${attr} part="option">${data}</option>`
        )}
          </select>` : "";
    }
    render() {
        return this.items.map((itemOrArray)=>Array.isArray(itemOrArray) ? html`<div class="group multi" part="group">
            ${itemOrArray.map(this.createLabeledControls)}
          </div>` : html`<div class="group" part="group">
            ${this.createLabeledControls(itemOrArray)}
          </div>`
        );
    }
    updated() {
        this.root.querySelectorAll('input[type="date"]').forEach((el)=>el.addEventListener("change", changeSelectColor)
        );
        this.root.querySelectorAll('input[type="file"]').forEach((el)=>el.addEventListener("change", (event)=>this.handleFileSelection(event)
            )
        );
        this.dom.class["control"].forEach((control, i)=>{
            const flattedItems = this.items.flat(1);
            const itemListeners = flattedItems[i].listeners;
            if (itemListeners) {
                Object.entries(itemListeners).forEach(([ev, listener])=>{
                    control.addEventListener(ev, listener);
                });
            }
        });
    }
    handleFileSelection(event) {
        const inputElement = event.currentTarget;
        const files = inputElement.files;
        if (!files || !files?.length) throw Error("No file!");
        const file = files.item(0);
        const fileType = inputElement.getAttribute("file-type");
        const readingMethod = inputElement.getAttribute("reading-method");
        const reader = new FileReader();
        if (typeof fileType === "string" && !validFileType(file, fileType)) {
            inputElement.setCustomValidity(`Must be ${fileType}`);
        } else {
            inputElement.setCustomValidity("");
        }
        if (typeof readingMethod === "string") {
            if (!readingMethods.has(readingMethod)) {
                throw new Error("Invalid readingMethod.");
            }
            reader[readingMethod](file);
        } else {
            reader.readAsDataURL(file);
        }
        reader.addEventListener("load", (event)=>{
            this.inputFile = reader.result;
        });
    }
    getInput() {
        return Object.fromEntries(this.dom.class["control"].map((el)=>[
                el.id,
                el.getAttribute("type") === "image" ? el.getAttribute("src") || "" : el.getAttribute("type") === "file" ? this.inputFile || "" : el.value.trim(), 
            ]
        ));
    }
    getFormData() {
        const form = document.createElement("form");
        this.dom.class["control"].forEach((c)=>{
            form.append(c.cloneNode(true));
        });
        return new FormData(form);
    }
    reportValidity() {
        return this.dom.class["control"].every((el)=>el.reportValidity()
        );
    }
    reset() {
        const inputsAndTextareas = this.dom.class["control"];
        const selects = [
            ...this.root.querySelectorAll("select"), 
        ];
        inputsAndTextareas.forEach((el)=>el.value = ""
        );
        selects.forEach((el)=>el.selectedIndex = 0
        );
    }
    constructor(...args){
        super(...args);
        _initializerDefineProperty(this, "items", _descriptor, this);
    }
}) || _class, _dec = property({
    reflect: false,
    wait: true
}), _descriptor = _applyDecoratedDescriptor(_class.prototype, "items", [
    _dec
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return [];
    }
}), _class)) || _class;
function _applyDecoratedDescriptor1(target, property8, decorators, descriptor, context) {
    var desc2 = {};
    Object.keys(descriptor).forEach(function(key) {
        desc2[key] = descriptor[key];
    });
    desc2.enumerable = !!desc2.enumerable;
    desc2.configurable = !!desc2.configurable;
    if ("value" in desc2 || desc2.initializer) {
        desc2.writable = true;
    }
    desc2 = decorators.slice().reverse().reduce(function(desc, decorator) {
        return decorator ? decorator(target, property8, desc) || desc : desc;
    }, desc2);
    var hasAccessor = Object.prototype.hasOwnProperty.call(desc2, "get") || Object.prototype.hasOwnProperty.call(desc2, "set");
    if (context && desc2.initializer !== void 0 && !hasAccessor) {
        desc2.value = desc2.initializer ? desc2.initializer.call(context) : void 0;
        desc2.initializer = undefined;
    }
    if (hasAccessor) {
        delete desc2.writable;
        delete desc2.initializer;
        delete desc2.value;
    }
    if (desc2.initializer === void 0) {
        Object.defineProperty(target, property8, desc2);
        desc2 = null;
    }
    return desc2;
}
function _initializerDefineProperty1(target, property9, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property9, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
}
var _class1, _descriptor1, _dec2, _descriptor12, _dec11, _descriptor2, _dec22, _descriptor3, _dec3, _descriptor4, _dec4;
var _dec5 = customElement("nice-form");
_class1 = _dec5(((_class1 = class NiceForm extends Shadow {
    static styles = css`
    :host {
      padding: 16px;
      display: inline-block;
      box-sizing: border-box;
      width: 100%;
      max-width: 100%;
      cursor: default;
      overflow-wrap: anywhere;
      color: var(--niceFormColor, inherit);
      --niceFormInputBackgroundColor: #f6f9fc;
      --niceFormPlaceholderColor: #8898aa;
    }
    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    #submit-container {
      display: flex;
      flex-direction: column;
    }
    .submit {
      font: inherit;
      font-size: 16px;
      font-weight: 600;
      height: 36px;
      letter-spacing: 0.375px;
      text-transform: uppercase;
      background: var(--niceFormSubmitBackground);
      color: var(--niceFormSubmitColor);
      border: var(--niceFormSubmitBorder, 1.7px solid var(--primaryDark));
      border-radius: 4px;
      padding: var(--niceFormSubmitPaddingS, 0 13.5px);
      margin: var(--niceFormSubmitMargin, 16px 0 0 auto);
      cursor: pointer;
      transition: 150ms cubic-bezier(0.215, 0.61, 0.355, 1);
      transition-property: all;
      max-width: var(--niceFormSubmitMaxWidth, 100%);
      min-width: initial;
      width: auto;
    }
    .submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1),
        0 3px 6px rgba(0, 0, 0, 0.08);
    }
    .submit:focus-visible {
      box-shadow: var(
        --niceFormFocusBoxShadow,
        var(--focusBoxShadow, 0 0 0 1.4pt #00d4ff)
      );
      border-radius: 6px;
      outline: none;
    }

    .message {
      display: none;
      font-size: var(--messageFontSize, 17.5px);
    }
    #submitMessage {
      color: var(--niceFormSubmitMessageColor, darkgreen);
    }
    #submitErrorMessage {
      color: var(--niceFormSubmitErrorMessageColor, darkred);
    }

    ::slotted(*) {
      text-align: center;
      margin-top: 32px;
      border-radius: 4px;
      font-size: 16px;
    }

    @media (min-width: 640px) {
      :host {
        width: auto;
        padding: 16px 18px 20px 24px;
      }

      #submit-container {
        flex-direction: row;
      }

      .submit {
        height: 40px;
        font-size: 17.5px;
        padding: var(--niceFormSubmitPaddingL, 0 14px);
      }
      .message {
        margin-right: 16px;
      }

      ::slotted(*) {
        font-size: inherit;
      }
    }
  `;
    render() {
        return html`
      <form @id="formId" ...${this.attr}>
        <labeled-controls @id="controls" part="controls"></labeled-controls>
        ${this.submit.map(({ id , attr  })=>html`<div id="submit-container">
              <p @id="submitMessage" class="message"></p>
              <p @id="submitErrorMessage" class="message"></p>
              <input
                click=${this.handleButtonClick}
                name="${id}"
                type="submit"
                id="${id}"
                @class="submit"
                ...${attr}
              />
            </div>`
        )}
      </form>
      <slot></slot>
    `;
    }
    reset() {
        this.dom.id["controls"].reset();
    }
    getInput() {
        return this.dom.id["controls"].getInput();
    }
    handleButtonClick(event) {
        event.preventDefault();
        if (this.dom.id["controls"].reportValidity()) {
            const data = this.dom.id["controls"].getInput();
            if (this.resource) {
                fetch(this.resource, {
                    ...this.fetchOptions.requestInit,
                    body: JSON.stringify({
                        ...data
                    }, null, 2)
                }).then((res)=>{
                    if (!res.ok) {
                        changeCss({
                            display: "block"
                        }, this.dom.id["submitErrorMessage"]);
                        throw new Error(`Received status code ${res.status} instead of 200-299 range.`);
                    } else {
                        setTimeout(()=>{
                            this.dom.id["formId"].reset();
                            changeCss({
                                display: "block"
                            }, this.dom.id["submitMessage"]);
                        }, 50);
                    }
                });
            } else {
                this.dispatchEvent(new CustomEvent("niceFormSubmitted", {
                    detail: data,
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }
    updated() {
        this.dom.id["controls"].items = this.items;
        if (this.fetchOptions.submitMessage !== null) {
            this.dom.id["submitMessage"].innerHTML = this.fetchOptions.submitMessage;
        }
        if (this.fetchOptions.submitErrorMessage !== null) {
            this.dom.id["submitErrorMessage"].innerHTML = this.fetchOptions.submitErrorMessage;
        }
    }
    constructor(...args){
        super(...args);
        _initializerDefineProperty1(this, "items", _descriptor1, this);
        _initializerDefineProperty1(this, "submit", _descriptor12, this);
        _initializerDefineProperty1(this, "attr", _descriptor2, this);
        _initializerDefineProperty1(this, "resource", _descriptor3, this);
        _initializerDefineProperty1(this, "fetchOptions", _descriptor4, this);
    }
}) || _class1, _dec2 = property({
    wait: true,
    reflect: false
}), _dec11 = property({
    wait: true,
    reflect: false
}), _dec22 = property({
    reflect: false
}), _dec3 = property(), _dec4 = property({
    reflect: false
}), _descriptor1 = _applyDecoratedDescriptor1(_class1.prototype, "items", [
    _dec2
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return [];
    }
}), _descriptor12 = _applyDecoratedDescriptor1(_class1.prototype, "submit", [
    _dec11
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return [];
    }
}), _descriptor2 = _applyDecoratedDescriptor1(_class1.prototype, "attr", [
    _dec22
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return {};
    }
}), _descriptor3 = _applyDecoratedDescriptor1(_class1.prototype, "resource", [
    _dec3
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return null;
    }
}), _descriptor4 = _applyDecoratedDescriptor1(_class1.prototype, "fetchOptions", [
    _dec4
], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function() {
        return {
            requestInit: {},
            submitMessage: null,
            submitErrorMessage: null
        };
    }
}), _class1)) || _class1;
const niceForm = document.getElementById("ogImageForm");
const ogImagePreview = document.getElementById("ogImagePreview");
const defaultImageUrl = new URL(`/assets/design/logos/hashrock_simple.png`, location.origin).href;
function update(img) {
    return (labeledControls)=>{
        const input = labeledControls.getInput();
        const processedInput = Object.entries(input).filter(([_key, value])=>!!value
        ).filter(([key, _value])=>key !== "textInput"
        );
        const searchParams = new URLSearchParams(processedInput);
        const url = new URL(`/${input.textInput}.png`, location.origin);
        url.search = searchParams.toString();
        img.setAttribute("src", url.href);
    };
}
const updatePreview = update(ogImagePreview);
function getShadowRootHost(el) {
    const root = el.getRootNode();
    if (root instanceof ShadowRoot) {
        return root.host;
    } else {
        throw new Error("The HTMLElement has no ShadowRoot as parent.");
    }
}
function updatePreviewOnEvent(event) {
    updatePreview(getShadowRootHost(event.currentTarget));
}
function copyAttribute(el) {
    return (attrName)=>{
        return copyToClipboardLegacy(el.getAttribute(attrName));
    };
}
function copyOgImageOnEvent() {
    return copyAttribute(ogImagePreview)("src");
}
function copyToClipboardLegacy(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        return window.clipboardData.setData("Text", text);
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        const textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return prompt("Copy to clipboard: Ctrl+C, Enter", text);
        } finally{
            document.body.removeChild(textarea);
        }
    }
}
niceForm.addEventListener("niceFormSubmitted", copyOgImageOnEvent);
niceForm.items = [
    {
        kind: "select",
        label: "Theme",
        id: "theme",
        options: [
            {
                data: "Light"
            },
            {
                data: "Dark"
            }
        ],
        listeners: {
            change: updatePreviewOnEvent
        }
    },
    {
        kind: "select",
        label: "Font Size",
        id: "font-size",
        options: [
            {
                data: "100px"
            },
            {
                data: "125px"
            },
            {
                data: "150px"
            },
            {
                data: "175px"
            },
            {
                data: "200px"
            },
            {
                data: "225px"
            }, 
        ],
        listeners: {
            change: updatePreviewOnEvent
        }
    },
    {
        kind: "input",
        label: "Text Input",
        id: "textInput",
        attr: {
            value: "Hello World",
            minlength: "0",
            maxlength: "500"
        },
        listeners: {
            change: updatePreviewOnEvent
        }
    },
    {
        kind: "input",
        label: "Image",
        id: "image",
        attr: {
            value: defaultImageUrl,
            type: "url",
            minlength: "0",
            maxlength: "500"
        },
        listeners: {
            change: updatePreviewOnEvent
        }
    },
    [
        {
            kind: "input",
            label: "Image Size",
            id: "width",
            attr: {
                type: "number",
                placeholder: "width",
                minlength: "0",
                maxlength: "20"
            },
            listeners: {
                change: updatePreviewOnEvent
            }
        },
        {
            kind: "input",
            label: "Image Height",
            isVisuallyHidden: true,
            id: "height",
            attr: {
                type: "number",
                placeholder: "height",
                minlength: "0",
                maxlength: "20"
            },
            listeners: {
                change: updatePreviewOnEvent
            }
        }, 
    ], 
];
niceForm.submit = [
    {
        id: "copy",
        attr: {
            value: "Copy",
            title: "Click to copy image URL to clipboard"
        }
    }, 
];
updatePreview(niceForm.root.querySelector("labeled-controls"));

