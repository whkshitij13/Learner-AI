function analyzeLwc(files) {
  const errors = [];
  const hints = [];
  const html = files.html || "";
  const js = files.js || "";
  const css = files.css || "";

  if (!html.includes("<template>")) {
    errors.push("`component.html` should wrap markup inside a `<template>` tag.");
  }

  if (!js.includes("LightningElement")) {
    errors.push("`component.js` should import `LightningElement` from `lwc`.");
  }

  if (!js.includes("export default class")) {
    errors.push("`component.js` should export a default component class.");
  }

  if (js.includes('onclick="')) {
    errors.push("Inline DOM handlers are not the LWC pattern. Use template event binding like `onclick={handleClick}`.");
  }

  if (!css.trim()) {
    hints.push("Add a small `:host` style block so learners see where component-level CSS belongs.");
  }

  if (!js.includes("@api")) {
    hints.push("If the exercise needs parent input, add `@api` to public properties like `recordId`.");
  }

  if (!html.includes("{")) {
    hints.push("Try rendering one reactive value in the template so binding becomes visible.");
  }

  return {
    summary: errors.length
      ? "The LWC bundle has a few structure issues that should be fixed before it would be interview-ready."
      : "The LWC bundle shape looks solid. You can refine naming, reactivity, and event handling next.",
    errors,
    hints
  };
}

function analyzeApex(files) {
  const errors = [];
  const hints = [];
  const code = files.class || "";

  if (!code.includes("class")) {
    errors.push("The Apex submission should declare a class.");
  }

  if (!code.includes("{") || !code.includes("}")) {
    errors.push("The Apex class looks incomplete. Check curly braces.");
  }

  if (!/public|private|global/.test(code)) {
    errors.push("Add an Apex access modifier such as `public` or `private`.");
  }

  if (!code.includes("with sharing")) {
    hints.push("Use `with sharing` by default unless you intentionally need different behavior.");
  }

  if (!code.includes("@isTest")) {
    hints.push("Add or pair this with a test class so learners practice deployable Apex.");
  }

  if (!/static\s+\w+/.test(code)) {
    hints.push("Add a method signature so the class shows a callable behavior.");
  }

  return {
    summary: errors.length
      ? "The Apex class has structural gaps. Tighten the class declaration first, then add Salesforce-specific good practices."
      : "The Apex class outline looks reasonable. Next focus on sharing, tests, and defensive coding.",
    errors,
    hints
  };
}

export function buildPracticeReview(payload) {
  return payload.track === "lwc" ? analyzeLwc(payload.files) : analyzeApex(payload.files);
}

export function getFallbackTemplate(track) {
  if (track === "lwc") {
    return `// component.js
import { LightningElement, api } from 'lwc';

export default class PracticeComponent extends LightningElement {
  @api recordId;
}

<!-- component.html -->
<template>
  <lightning-card title="Practice">
    <p class="slds-p-horizontal_small">{recordId}</p>
  </lightning-card>
</template>

/* component.css */
:host {
  display: block;
}`;
  }

  return `public with sharing class PracticeController {
  public static void run() {
    System.debug('Practice ready');
  }
}`;
}
