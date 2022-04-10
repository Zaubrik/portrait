import type { LabeledControls, NiceForm } from "./deps.ts";

const niceForm = document.getElementById("ogImageForm") as NiceForm;
const ogImagePreview = document.getElementById("ogImagePreview")!;
const defaultImageUrl = "https://deno.land/images/artwork/hashrock_simple.png";

function update(img: HTMLElement) {
  return (labeledControls: LabeledControls) => {
    const input = labeledControls.getInput();
    const processedInput = Object.entries(input)
      .filter(([_key, value]) => !!value)
      .filter(([key, _value]) => key !== "textInput");
    const searchParams = new URLSearchParams(processedInput);
    const url = new URL(`/${input.textInput}.png`, location.origin);
    url.search = searchParams.toString();
    img.setAttribute("src", url.href);
  };
}

const updatePreview = update(ogImagePreview);

function getShadowRootHost<E extends HTMLElement>(
  el: HTMLElement,
) {
  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.host as E;
  } else {
    throw new Error("The HTMLElement has no ShadowRoot as parent.");
  }
}

function updatePreviewOnEvent(event: Event) {
  updatePreview(
    getShadowRootHost<LabeledControls>(event.currentTarget as HTMLElement),
  );
}

function copyAttribute(el: HTMLElement) {
  return (attrName: string) => {
    return copyToClipboardLegacy(el.getAttribute(attrName)!);
  };
}

function copyOgImageOnEvent() {
  return copyAttribute(ogImagePreview)("src");
}

/* Adopted from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript/33928558#33928558 */
function copyToClipboardLegacy(text: string) {
  // @ts-ignore: external code
  if (window.clipboardData && window.clipboardData.setData) {
    // @ts-ignore: external code
    return window.clipboardData.setData("Text", text);
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported("copy")
  ) {
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
    } finally {
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
    options: [{ data: "Light" }, { data: "Dark" }],
    listeners: { change: updatePreviewOnEvent },
  },
  {
    kind: "select",
    label: "Font Size",
    id: "font-size",
    options: [
      { data: "100px" },
      { data: "125px" },
      { data: "150px" },
      { data: "175px" },
      { data: "200px" },
      { data: "225px" },
    ],
    listeners: { change: updatePreviewOnEvent },
  },
  {
    kind: "input",
    label: "Text Input",
    id: "textInput",
    attr: {
      value: "Hello World",
      minlength: "0",
      maxlength: "500",
    },
    listeners: { change: updatePreviewOnEvent },
  },
  {
    kind: "input",
    label: "Image",
    id: "image",
    attr: {
      value: defaultImageUrl,
      type: "url",
      minlength: "0",
      maxlength: "500",
    },
    listeners: { change: updatePreviewOnEvent },
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
        maxlength: "20",
      },
      listeners: { change: updatePreviewOnEvent },
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
        maxlength: "20",
      },
      listeners: { change: updatePreviewOnEvent },
    },
  ],
];
niceForm.submit = [
  {
    id: "copy",
    attr: { value: "Copy", title: "Click to copy image URL to clipboard" },
  },
];

updatePreview(niceForm.root.querySelector("labeled-controls")!);
