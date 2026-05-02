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

function analyzeGenericCode(payload) {
  const primary = Object.values(payload.files || {})
    .map((item) => String(item || ""))
    .join("\n\n");
  const errors = [];
  const hints = [];
  const language = String(payload.language || "").toLowerCase();

  if (!primary.trim()) {
    errors.push("The submission is empty. Add some starter code before reviewing.");
  }

  if ((language === "cpp" || language === "c++") && !primary.includes("#include")) {
    hints.push("C++ exercises usually start with at least one `#include`.");
  }

  if (language === "java" && !/\bclass\s+\w+/.test(primary)) {
    errors.push("A Java submission should declare a class.");
  }

  if (language === "python" && !/:/.test(primary)) {
    hints.push("Python blocks should use `:` and indentation.");
  }

  if ((language === "javascript" || language === "typescript") && !/function|=>|class|const|let/.test(primary)) {
    hints.push("Add a function, class, or variable so the example shows executable structure.");
  }

  if (!/[{}();]|class|def|function/.test(primary)) {
    hints.push("Add a small runnable example so the review has something concrete to evaluate.");
  }

  return {
    summary: errors.length
      ? "The practice submission needs a bit more structure before it feels runnable."
      : "The practice draft has a workable shape. Next refine correctness and language-specific structure.",
    errors,
    hints
  };
}

export function buildPracticeReview(payload) {
  if (payload.track === "lwc" || payload.language === "lwc") {
    return analyzeLwc(payload.files);
  }

  if (payload.track === "apex" || payload.language === "apex") {
    return analyzeApex(payload.files);
  }

  return analyzeGenericCode(payload);
}

export function getFallbackTemplate(track, language) {
  if (track === "lwc" || language === "lwc") {
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

  if (track === "apex" || language === "apex") {
    return `public with sharing class PracticeController {
  public static void run() {
    System.debug('Practice ready');
  }
}`;
  }

  if (language === "cpp" || language === "c++") {
    return `#include <iostream>

int main() {
  std::cout << "Practice ready" << std::endl;
  return 0;
}`;
  }

  if (language === "java") {
    return `public class Main {
  public static void main(String[] args) {
    System.out.println("Practice ready");
  }
}`;
  }

  if (language === "python") {
    return `def main():
    print("Practice ready")

if __name__ == "__main__":
    main()`;
  }

  if (language === "javascript" || language === "typescript") {
    return `function main() {
  console.log("Practice ready");
}

main();`;
  }

  return `// Practice template
// Add a small runnable example for this language here.`;
}
