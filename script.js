const DATA = {
  lwc: [
    {
      id: "lwc-architecture",
      title: "Architecture and Bundle Structure",
      level: "Foundation",
      focus: "Understand how an LWC is built, exposed, and deployed.",
      objectives: [
        "Identify the purpose of HTML, JS, CSS, and js-meta.xml files.",
        "Explain where LWC runs and why web standards matter.",
        "Describe common targets such as app pages, record pages, and quick actions."
      ],
      deepDive: [
        "Lightning Web Components is Salesforce's modern UI framework built on custom elements, ES modules, Shadow DOM concepts, and browser-native eventing. This matters because interviewers expect you to position LWC as standards-based rather than proprietary-first.",
        "An LWC bundle is a folder whose file names match the component name. The HTML template defines structure, the JavaScript class manages state and behavior, CSS is scoped to the component, and the metadata file controls exposure and target configuration.",
        "In a real project, the metadata file is not a minor detail. It decides whether your component can appear on record pages, app pages, home pages, community pages, quick actions, flows, or tabs."
      ],
      example: `// accountSummary.js
import { LightningElement, api } from 'lwc';

export default class AccountSummary extends LightningElement {
  @api recordId;
}

<!-- accountSummary.html -->
<template>
  <lightning-card title="Account Summary">
    <p class="slds-p-horizontal_small">Current record: {recordId}</p>
  </lightning-card>
</template>

<!-- accountSummary.js-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>61.0</apiVersion>
  <isExposed>true</isExposed>
  <targets>
    <target>lightning__RecordPage</target>
    <target>lightning__AppPage</target>
  </targets>
</LightningComponentBundle>`,
      interview: "LWC is a standards-based component framework. The js-meta.xml file decides where the component is exposed, and the bundle structure keeps UI, behavior, styling, and configuration cleanly separated.",
      pitfalls: [
        "Forgetting that folder name and file names must match.",
        "Treating js-meta.xml as optional even though it controls exposure.",
        "Explaining LWC only as a Salesforce abstraction instead of a web-standards framework."
      ],
      quiz: [
        {
          q: "Which file decides whether a component can be added in Lightning App Builder?",
          options: [".html", ".css", ".js-meta.xml", ".svg"],
          answer: 2
        },
        {
          q: "What is the best description of LWC?",
          options: [
            "A Visualforce replacement only",
            "A standards-based UI framework on Salesforce",
            "A server-side Apex template engine",
            "A database query layer"
          ],
          answer: 1
        }
      ],
      exercise: {
        title: "Build a minimal exposed component",
        prompt: "Write a small `helloLearner` component. Accept a public `recordId`, display it inside a card, and expose the component for Record Page and Home Page usage.",
        starter: `// helloLearner.js
import { LightningElement, api } from 'lwc';

export default class HelloLearner extends LightningElement {
  // write code here
}

<!-- helloLearner.html -->
<template>
  <!-- write markup here -->
</template>`,
        checklist: [
          "Uses `@api recordId`.",
          "Renders the record id in the template.",
          "Mentions js-meta.xml targets for exposure."
        ]
      }
    },
    {
      id: "lwc-reactivity",
      title: "Templates, Binding, and Reactivity",
      level: "Foundation",
      focus: "Move data correctly between JavaScript state and template output.",
      objectives: [
        "Explain one-way data binding in LWC.",
        "Use event handlers to move user input back into component state.",
        "Use getters and immutable updates for reliable rerendering."
      ],
      deepDive: [
        "LWC templates support one-way binding from JavaScript to HTML. When a user changes a field, you capture the event and update state manually. This is a common interview distinction from frameworks that emphasize two-way binding.",
        "Primitive fields rerender naturally when reassigned. Arrays and objects should usually be updated immutably so the framework gets a new reference and rerenders predictably.",
        "Template expressions are intentionally limited. If a value needs computation, put the logic in a getter instead of attempting inline expressions in HTML."
      ],
      example: `import { LightningElement } from 'lwc';

export default class ContactGreeting extends LightningElement {
  firstName = '';
  skills = ['LWC'];

  handleNameChange(event) {
    this.firstName = event.target.value;
  }

  addSkill() {
    this.skills = [...this.skills, 'Apex'];
  }

  get greeting() {
    return this.firstName ? \`Hello \${this.firstName}\` : 'Hello learner';
  }
}`,
      interview: "LWC uses one-way binding. UI updates happen when the JavaScript state changes, and user input is handled through events like `change` or `input`.",
      pitfalls: [
        "Trying to write complex expressions directly in the template.",
        "Using `array.push()` and expecting the UI to always rerender the way you want.",
        "Confusing HTML binding with automatic reverse binding."
      ],
      quiz: [
        {
          q: "What is the recommended way to calculate a derived display value?",
          options: ["Inline template expression", "A getter in JavaScript", "A CSS rule", "An XML target"],
          answer: 1
        },
        {
          q: "Which update style is safer for arrays in LWC?",
          options: ["`this.items.push(x)`", "`this.items = [...this.items, x]`", "`items.add(x)`", "`items += x`"],
          answer: 1
        }
      ],
      exercise: {
        title: "Reactive form micro-task",
        prompt: "Write a component with a `lightning-input` for user name, show a live greeting, and add a button that appends a new skill into an array using immutable update syntax.",
        starter: `import { LightningElement } from 'lwc';

export default class ReactivePractice extends LightningElement {
  name = '';
  skills = [];

  // add handler, getter, and array update method
}`,
        checklist: [
          "Uses an input event handler.",
          "Uses a getter for the greeting.",
          "Updates the array by creating a new array reference."
        ]
      }
    },
    {
      id: "lwc-decorators",
      title: "Decorators, Lifecycle, and Rendering",
      level: "Core",
      focus: "Know when to use `@api`, `@wire`, lifecycle hooks, and conditional rendering.",
      objectives: [
        "Use `@api` for public properties and methods.",
        "Explain `@wire` as reactive data provisioning.",
        "Know what belongs in `connectedCallback`, `renderedCallback`, and `disconnectedCallback`."
      ],
      deepDive: [
        "`@api` creates the public surface of a component. It is how a parent passes input down or invokes a public method on a child component.",
        "`@wire` is not just a syntax feature. It is a declarative, reactive way to request data from Apex or UI API when parameters change.",
        "Lifecycle hooks matter because many bugs come from doing work at the wrong time. For example, repeated logic inside `renderedCallback` can create loops, while cleanup logic belongs in `disconnectedCallback`."
      ],
      example: `import { LightningElement, api, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

export default class LifecycleWireDemo extends LightningElement {
  @api searchKey = '';
  hasRendered = false;

  @wire(getAccounts, { searchKey: '$searchKey' })
  accounts;

  connectedCallback() {
    console.log('Component inserted');
  }

  renderedCallback() {
    if (this.hasRendered) {
      return;
    }
    this.hasRendered = true;
    console.log('First render only');
  }
}`,
      interview: "Use `@api` for public communication, `@wire` for reactive data retrieval, `connectedCallback` for setup, and guard `renderedCallback` if logic should run only once.",
      pitfalls: [
        "Calling Apex in `constructor`.",
        "Mutating state repeatedly in `renderedCallback`.",
        "Saying `@track` is needed for every field in modern LWC."
      ],
      quiz: [
        {
          q: "Which decorator exposes a property or method publicly?",
          options: ["`@wire`", "`@api`", "`@AuraEnabled`", "`@testVisible`"],
          answer: 1
        },
        {
          q: "Where should cleanup like event listener removal happen?",
          options: ["`constructor`", "`renderedCallback`", "`disconnectedCallback`", "`@wire`"],
          answer: 2
        }
      ],
      exercise: {
        title: "Public API and lifecycle task",
        prompt: "Write a child LWC that exposes a public method called `refreshFromParent`, stores a public `recordId`, and logs a one-time message in `renderedCallback` without creating a rerender loop.",
        starter: `import { LightningElement, api } from 'lwc';

export default class ChildDemo extends LightningElement {
  // complete this class
}`,
        checklist: [
          "Uses `@api recordId`.",
          "Adds an `@api` public method.",
          "Guards one-time render logic with a boolean."
        ]
      }
    },
    {
      id: "lwc-communication",
      title: "Events, Parent-Child Communication, and LMS",
      level: "Core",
      focus: "Choose the right communication pattern for component relationships.",
      objectives: [
        "Use `CustomEvent` for child-to-parent communication.",
        "Use `@api` for parent-to-child data and method calls.",
        "Explain when Lightning Message Service is the right tool."
      ],
      deepDive: [
        "Component communication in Salesforce should be explained as a decision tree. Use direct component APIs when there is a hierarchy, and use Lightning Message Service when components are unrelated.",
        "For child-to-parent flow, the child dispatches a `CustomEvent` with a payload in `detail`. The parent listens with `on<eventname>` syntax in the template.",
        "Lightning Message Service is especially useful when components live in different DOM trees or on different regions of the page but still need coordination."
      ],
      example: `// child.js
handleSelect() {
  this.dispatchEvent(
    new CustomEvent('selectaccount', {
      detail: { recordId: '001xx000003', label: 'Edge Communications' }
    })
  );
}

<!-- parent.html -->
<c-account-row onselectaccount={handleSelectAccount}></c-account-row>

// parent.js
handleSelectAccount(event) {
  this.selectedAccountId = event.detail.recordId;
}`,
      interview: "For hierarchy, use `@api` down and `CustomEvent` up. For unrelated components, prefer Lightning Message Service over old pub-sub patterns.",
      pitfalls: [
        "Using LMS even when a clean parent-child relationship already exists.",
        "Sending too much data in events instead of a focused payload.",
        "Forgetting that event names are lowercase in markup."
      ],
      quiz: [
        {
          q: "What is the best default pattern for child-to-parent communication?",
          options: ["`@wire`", "`CustomEvent`", "SOQL", "CSS custom property"],
          answer: 1
        },
        {
          q: "When are you most likely to use Lightning Message Service?",
          options: ["For the same component file", "For unrelated components", "For CSS theming", "For js-meta.xml targets"],
          answer: 1
        }
      ],
      exercise: {
        title: "Event dispatch practice",
        prompt: "Write child-side code that dispatches a custom event named `savecontact` with `contactId` and `email` in `detail`, then sketch the parent markup listener.",
        starter: `// child.js
saveContact() {
  // dispatch custom event here
}

<!-- parent.html -->
<!-- add listener here -->`,
        checklist: [
          "Uses `new CustomEvent('savecontact', { detail: ... })`.",
          "Sends only the needed payload.",
          "Uses `onsavecontact={...}` on the parent."
        ]
      }
    },
    {
      id: "lwc-data",
      title: "Data Access: Wire, Imperative Apex, and LDS",
      level: "Very Important",
      focus: "Choose the right retrieval and save pattern for each use case.",
      objectives: [
        "Differentiate `@wire` and imperative Apex.",
        "Use LDS/UI API for standard record operations.",
        "Explain caching and read-only rules with `cacheable=true`."
      ],
      deepDive: [
        "Use wire for read-first reactive screens where the UI should refresh automatically as parameters change. Typical examples are record displays, filtered lists, and dashboards.",
        "Use imperative Apex for explicit user actions like save, update, delete, or a search fired after debounce. Imperative calls return a promise and give you control over timing and error handling.",
        "Use Lightning Data Service or UI API first when Salesforce already provides the record access pattern you need, because it reduces custom Apex and respects platform security and caching behavior."
      ],
      example: `// Apex
public with sharing class AccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> searchAccounts(String searchKey) {
    return [
      SELECT Id, Name, Industry
      FROM Account
      WHERE Name LIKE :('%' + searchKey + '%')
      LIMIT 20
    ];
  }

  @AuraEnabled
  public static void renameAccount(Id accountId, String newName) {
    update new Account(Id = accountId, Name = newName);
  }
}

// LWC
@wire(searchAccounts, { searchKey: '$searchKey' })
accounts;

handleSave() {
  renameAccount({ accountId: this.recordId, newName: this.editedName });
}`,
      interview: "Use `@wire` for reactive read scenarios, imperative Apex for controlled actions, and LDS/UI API before custom Apex when standard record operations are enough.",
      pitfalls: [
        "Doing DML inside a `cacheable=true` method.",
        "Using imperative Apex for every read even when wire is a better fit.",
        "Skipping LDS for standard CRUD scenarios."
      ],
      quiz: [
        {
          q: "Which approach is best for a button-click save action?",
          options: ["`@wire`", "Imperative Apex", "Metadata XML", "CSS module"],
          answer: 1
        },
        {
          q: "What is true about `cacheable=true` Apex methods?",
          options: ["They can perform DML", "They are read-only methods for caching scenarios", "They only work in Aura", "They replace `@api`"],
          answer: 1
        }
      ],
      exercise: {
        title: "Choose the right call pattern",
        prompt: "Write one `@wire` example for searching accounts by `searchKey`, and one imperative method call for updating the selected account name when the user clicks Save.",
        starter: `import { LightningElement, wire } from 'lwc';
import searchAccounts from '@salesforce/apex/AccountController.searchAccounts';
import renameAccount from '@salesforce/apex/AccountController.renameAccount';

export default class AccountSearch extends LightningElement {
  searchKey = '';
  recordId = '';
  editedName = '';

  // complete wire and save logic
}`,
        checklist: [
          "Uses reactive wire syntax with `$searchKey`.",
          "Uses promise-based imperative call for save.",
          "Keeps read and write patterns separate."
        ]
      }
    },
    {
      id: "lwc-ui-patterns",
      title: "Forms, Datatable, Navigation, and Performance",
      level: "Scenario",
      focus: "Handle real project UI patterns without building slow or fragile screens.",
      objectives: [
        "Describe datatable, pagination, inline edit, and row actions.",
        "Explain debounce, lazy loading, and pagination for performance.",
        "Use navigation and toast patterns appropriately."
      ],
      deepDive: [
        "Real LWC work is often not about syntax; it is about screen behavior. Datatables, editable forms, record navigation, and toast messaging appear in almost every enterprise project.",
        "Performance conversations should mention server-side filtering, pagination, debounce for search input, avoiding repeated calls in lifecycle hooks, and keeping components focused.",
        "A strong answer usually combines user experience with platform limits. For example, you do not fetch thousands of records into a datatable just because the component can render them."
      ],
      example: `columns = [
  { label: 'Name', fieldName: 'Name', sortable: true },
  { label: 'Industry', fieldName: 'Industry' },
  {
    type: 'action',
    typeAttributes: {
      rowActions: [
        { label: 'View', name: 'view' },
        { label: 'Delete', name: 'delete' }
      ]
    }
  }
];

timer;
handleSearch(event) {
  window.clearTimeout(this.timer);
  const value = event.target.value;
  this.timer = window.setTimeout(() => {
    this.searchKey = value;
  }, 350);
}`,
      interview: "Talk about pagination, debounce, lean components, and using standard UI patterns like toasts and navigation mixins instead of reinventing basic platform behavior.",
      pitfalls: [
        "Loading all rows into a datatable at once.",
        "Not using a stable key for repeated templates.",
        "Firing an Apex call on every keystroke."
      ],
      quiz: [
        {
          q: "What is debounce solving in an LWC search box?",
          options: ["Security issues", "Repeated unnecessary server calls", "CSS conflicts", "Metadata deployment errors"],
          answer: 1
        },
        {
          q: "What is the recommended approach for a very large datatable?",
          options: ["Load every record immediately", "Use pagination or lazy loading", "Use `renderedCallback` loops", "Move data into CSS"],
          answer: 1
        }
      ],
      exercise: {
        title: "Performance-oriented search task",
        prompt: "Write a debounced `handleSearch` method and describe how you would combine it with server-side pagination for an account datatable.",
        starter: `timer;

handleSearch(event) {
  // add debounce logic
}`,
        checklist: [
          "Clears the old timer before setting a new one.",
          "Updates the search key after a short delay.",
          "Mentions server-side pagination or lazy loading."
        ]
      }
    },
    {
      id: "lwc-security-testing",
      title: "Security, Jest Thinking, and Deployment Readiness",
      level: "Advanced",
      focus: "Build front-end components that respect Salesforce security and quality expectations.",
      objectives: [
        "Explain why UI hiding is not enough for security.",
        "Connect LWC work with secure Apex controllers.",
        "Understand what should be covered in component testing and release review."
      ],
      deepDive: [
        "Because LWC runs in the browser, true security must be enforced on the server side. Your UI can improve guidance, but object permissions, field permissions, and sharing must be honored in Apex or platform data services.",
        "A mature component also needs clear empty states, loading states, error states, and predictable feedback on success. These are product quality concerns that show up in interviews and real projects.",
        "For testing, a strong learner should be comfortable describing Jest-based LWC tests at a high level even if the project here is a static study site. Focus on rendering, event handling, and DOM assertions."
      ],
      example: `public with sharing class SecureAccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getVisibleAccounts() {
    return [
      SELECT Id, Name, Industry
      FROM Account
      WITH SECURITY_ENFORCED
      LIMIT 20
    ];
  }
}`,
      interview: "Say that LWC is client-side, so server-side security is mandatory. Then connect that to `with sharing`, CRUD/FLS checks, and secure data services.",
      pitfalls: [
        "Claiming hidden buttons are enough security.",
        "Ignoring empty, loading, and error states.",
        "Talking only about coverage instead of behavior and quality."
      ],
      quiz: [
        {
          q: "Is hiding a field in the UI sufficient security?",
          options: ["Yes", "No, security must be enforced server-side", "Only for admins", "Only with Shadow DOM"],
          answer: 1
        },
        {
          q: "Which phrase best strengthens an interview answer about LWC security?",
          options: ["`renderedCallback` only", "`WITH SECURITY_ENFORCED` and sharing checks", "`@track` everywhere", "Inline CSS controls access"],
          answer: 1
        }
      ],
      exercise: {
        title: "Security explanation drill",
        prompt: "Write a short secure design note for an account list component. Mention how the UI behaves for loading and errors, and what the Apex controller must enforce.",
        starter: `Component behavior:
- Loading:
- Error:

Server-side enforcement:
- `,
        checklist: [
          "Mentions loading and error states.",
          "Mentions sharing plus CRUD/FLS enforcement.",
          "Clearly states that front-end hiding alone is not security."
        ]
      }
    }
  ],
  apex: [
    {
      id: "apex-core",
      title: "Apex Fundamentals and Execution Model",
      level: "Foundation",
      focus: "Understand what Apex is and how it runs on the Salesforce platform.",
      objectives: [
        "Describe Apex as a strongly typed, object-oriented language on Salesforce.",
        "Explain transaction context and why limits exist.",
        "Understand classes, methods, variables, and collections."
      ],
      deepDive: [
        "Apex is a server-side programming language used to implement business logic, automation, integrations, and controllers for Lightning components. It runs in Salesforce-managed transactions and is deeply tied to the platform's data and security model.",
        "Apex syntax feels familiar to Java or C# developers, but its execution constraints are different because every transaction shares a multi-tenant platform. That is why governor limits, bulkification, and careful query design matter so much.",
        "When explaining Apex to interviewers, connect syntax knowledge with platform behavior. Knowing a `Map<Id, Account>` is not enough; you should know why it helps reduce queries and improve trigger performance."
      ],
      example: `public class InvoiceService {
  public static Decimal calculateDiscount(Decimal amount, Decimal percentage) {
    return amount * percentage / 100;
  }
}`,
      interview: "Apex is Salesforce's strongly typed, object-oriented server-side language used for business logic, integrations, triggers, async processing, and LWC or Aura controllers.",
      pitfalls: [
        "Explaining Apex like plain Java and ignoring platform transaction limits.",
        "Forgetting that most real logic operates inside a shared transaction context.",
        "Ignoring collections even though they are central to bulk-safe design."
      ],
      quiz: [
        {
          q: "Where does Apex run?",
          options: ["Only in the browser", "On the Salesforce server platform", "Inside CSS", "Inside the js-meta.xml file"],
          answer: 1
        },
        {
          q: "Why are governor limits important in Apex?",
          options: ["To style records", "To protect shared platform resources", "To create HTML", "To replace test classes"],
          answer: 1
        }
      ],
      exercise: {
        title: "Basic class writing drill",
        prompt: "Write an Apex class `LeadScoringService` with a static method that takes an integer base score and a bonus score, then returns the total.",
        starter: `public class LeadScoringService {
  // add method here
}`,
        checklist: [
          "Defines a public class.",
          "Uses a static method.",
          "Returns the computed total."
        ]
      }
    },
    {
      id: "apex-soql-dml",
      title: "SOQL, DML, and Collections",
      level: "Core",
      focus: "Retrieve and modify Salesforce data the right way.",
      objectives: [
        "Write selective SOQL queries.",
        "Use DML and Database methods appropriately.",
        "Use lists, sets, and maps for efficient record processing."
      ],
      deepDive: [
        "SOQL is used to retrieve Salesforce records. A strong answer includes relationship queries, bind variables, field selection discipline, and awareness of row and query count limits.",
        "DML statements like `insert`, `update`, `delete`, and `upsert` operate on records. Database methods such as `Database.insert(records, false)` are useful when you need partial success handling.",
        "Collections are not just language features; they are your main tools for writing bulk-safe code. Lists preserve order, sets deduplicate values, and maps make lookups efficient."
      ],
      example: `Set<Id> accountIds = new Set<Id>{'001xx000001AAA'};

List<Contact> contacts = [
  SELECT Id, LastName, AccountId
  FROM Contact
  WHERE AccountId IN :accountIds
];

Database.SaveResult[] results =
  Database.insert(new List<Account>{
    new Account(Name = 'Northwind'),
    new Account(Name = 'Cloud Kicks')
  }, false);`,
      interview: "Mention bind variables, selecting only required fields, and using collections to avoid repeated queries or DML.",
      pitfalls: [
        "SOQL inside loops.",
        "Using full DML statements when partial success is required.",
        "Querying more fields or rows than the use case needs."
      ],
      quiz: [
        {
          q: "Which collection is best when you need unique record ids?",
          options: ["List", "Set", "Map values only", "String"],
          answer: 1
        },
        {
          q: "Which call supports partial success during insert?",
          options: ["`insert records;`", "`Database.insert(records, false)`", "`System.debug(records)`", "`upsert false`"],
          answer: 1
        }
      ],
      exercise: {
        title: "Query and save task",
        prompt: "Write SOQL to fetch account `Id` and `Name` for a set of ids, then write a `Database.insert(records, false)` example for two new accounts.",
        starter: `Set<Id> accountIds = new Set<Id>();

// write SOQL here

// write partial-success insert here`,
        checklist: [
          "Uses `IN :accountIds` bind syntax.",
          "Selects only required fields.",
          "Shows `Database.insert(..., false)`."
        ]
      }
    },
    {
      id: "apex-triggers",
      title: "Triggers and Handler Pattern",
      level: "Very Important",
      focus: "Keep trigger logic organized, bulk-safe, and testable.",
      objectives: [
        "Differentiate before and after triggers.",
        "Move business logic into handler classes.",
        "Use trigger context variables correctly."
      ],
      deepDive: [
        "Triggers run when records are inserted, updated, deleted, or undeleted. The most important design principle is that triggers should stay thin and delegate business logic to handler or service classes.",
        "Before triggers are typically used for field updates or validation on the same record before save. After triggers are usually used when you need record ids, related record work, or asynchronous follow-up processing.",
        "A good explanation references `Trigger.new`, `Trigger.old`, context booleans, and how recursion or repeated updates are prevented through careful design rather than random static flags everywhere."
      ],
      example: `trigger AccountTrigger on Account (before insert, before update) {
  if (Trigger.isBefore) {
    AccountTriggerHandler.beforeSave(Trigger.new);
  }
}

public class AccountTriggerHandler {
  public static void beforeSave(List<Account> newRecords) {
    for (Account acc : newRecords) {
      if (String.isNotBlank(acc.Name)) {
        acc.Name = acc.Name.trim();
      }
    }
  }
}`,
      interview: "Keep triggers thin, move logic to a handler, and write everything to support batches of many records rather than a single record assumption.",
      pitfalls: [
        "Putting all logic directly in the trigger file.",
        "Writing code that only works for one record.",
        "Mixing before and after responsibilities without clear reasons."
      ],
      quiz: [
        {
          q: "What is the best place for complex trigger business logic?",
          options: ["Inside the trigger only", "A handler or service class", "CSS", "Metadata XML"],
          answer: 1
        },
        {
          q: "Which trigger timing is commonly used to modify fields on the same record before save?",
          options: ["After delete", "Before insert or before update", "After undelete only", "Scheduled Apex"],
          answer: 1
        }
      ],
      exercise: {
        title: "Thin trigger exercise",
        prompt: "Write a trigger on Contact `before insert, before update` that calls a handler method to normalize the email value to lowercase.",
        starter: `trigger ContactTrigger on Contact (before insert, before update) {
  // call handler here
}

public class ContactTriggerHandler {
  // add method here
}`,
        checklist: [
          "Trigger stays minimal.",
          "Handler loops through all records.",
          "Lowercases the email safely when present."
        ]
      }
    },
    {
      id: "apex-bulk-governor",
      title: "Bulkification and Governor Limits",
      level: "Critical",
      focus: "Write code that survives real Salesforce transaction sizes.",
      objectives: [
        "Avoid SOQL and DML inside loops.",
        "Use sets, maps, and one-pass aggregation patterns.",
        "Connect design choices directly to governor limits."
      ],
      deepDive: [
        "Bulkification means your code works correctly for 1 record, 200 records, and beyond. Salesforce may send many records through a trigger in a single transaction, so singleton logic fails quickly in production.",
        "Governor limits exist because Salesforce is multi-tenant. Your code gets bounded resources such as query count, DML count, CPU time, and heap size.",
        "The typical bulk-safe pattern is collect ids, query once, store results in a map, loop through the records once, then perform DML once outside the loop."
      ],
      example: `Set<Id> accountIds = new Set<Id>();
for (Contact con : Trigger.new) {
  if (con.AccountId != null) {
    accountIds.add(con.AccountId);
  }
}

Map<Id, Account> accountMap = new Map<Id, Account>([
  SELECT Id, Description
  FROM Account
  WHERE Id IN :accountIds
]);

List<Account> toUpdate = new List<Account>();
for (Contact con : Trigger.new) {
  Account acc = accountMap.get(con.AccountId);
  if (acc != null) {
    acc.Description = 'Touched by contact update';
    toUpdate.add(acc);
  }
}

if (!toUpdate.isEmpty()) {
  update toUpdate;
}`,
      interview: "Always connect bulkification with limit avoidance: no SOQL in loops, no DML in loops, query once, use maps for lookups, and update in batches.",
      pitfalls: [
        "Querying inside every loop iteration.",
        "Updating records one by one.",
        "Explaining limits without showing the design patterns that avoid them."
      ],
      quiz: [
        {
          q: "What should almost never appear inside a trigger loop?",
          options: ["Variable assignment", "SOQL or DML", "If statements", "String checks"],
          answer: 1
        },
        {
          q: "Why does Salesforce enforce governor limits?",
          options: ["To replace object-oriented code", "To protect shared resources in a multi-tenant platform", "To format queries", "To enable CSS scoping"],
          answer: 1
        }
      ],
      exercise: {
        title: "Bulk-safe redesign task",
        prompt: "Rewrite a bad trigger pattern that queries contacts inside a loop. Show the corrected version using a set of ids and a map.",
        starter: `// Bad example
for (Account acc : Trigger.new) {
  List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// Write the corrected pattern below`,
        checklist: [
          "Collects ids first.",
          "Queries once outside the loop.",
          "Uses a map or grouped processing approach."
        ]
      }
    },
    {
      id: "apex-async",
      title: "Async Apex: Future, Queueable, Batch, Scheduled",
      level: "Very Important",
      focus: "Choose the right async tool for background processing.",
      objectives: [
        "Explain when to use Queueable over Future.",
        "Know when Batch Apex is required.",
        "Understand trigger-to-async handoff patterns."
      ],
      deepDive: [
        "Future methods are simple but limited. Queueable Apex is usually the stronger modern choice because it supports richer types, better structure, and job chaining.",
        "Batch Apex is for large-scale processing when records should be handled in chunks. Scheduled Apex is for time-based execution, often launching other logic at controlled intervals.",
        "A mature answer also mentions using async patterns for integration callouts or post-commit work that should not block the original transaction."
      ],
      example: `public class AccountQueueJob implements Queueable, Database.AllowsCallouts {
  private Set<Id> accountIds;

  public AccountQueueJob(Set<Id> accountIds) {
    this.accountIds = accountIds;
  }

  public void execute(QueueableContext context) {
    List<Account> accounts = [
      SELECT Id, Name
      FROM Account
      WHERE Id IN :accountIds
    ];
    System.debug(accounts.size());
  }
}

System.enqueueJob(new AccountQueueJob(accountIds));`,
      interview: "Queueable is the default modern answer for many async needs, while Batch Apex is the right choice for very large record volumes.",
      pitfalls: [
        "Choosing Future automatically without justification.",
        "Using synchronous logic for long-running or callout-heavy work.",
        "Not matching the tool to the data volume."
      ],
      quiz: [
        {
          q: "Which async option is usually preferred over Future for modern Apex work?",
          options: ["Queueable", "Trigger", "Getter", "SOQL"],
          answer: 0
        },
        {
          q: "What is the best fit for processing millions of records?",
          options: ["Future", "Batch Apex", "Inline trigger code", "LWC wire"],
          answer: 1
        }
      ],
      exercise: {
        title: "Queueable sketch",
        prompt: "Write a Queueable class that accepts a set of account ids in the constructor and queries those accounts in `execute`.",
        starter: `public class AccountQueueJob implements Queueable {
  // write fields, constructor, and execute method
}`,
        checklist: [
          "Implements `Queueable`.",
          "Stores ids in a field through the constructor.",
          "Queries the records inside `execute`."
        ]
      }
    },
    {
      id: "apex-lwc-security",
      title: "Apex for LWC and Security Enforcement",
      level: "Very Important",
      focus: "Write controller methods that are usable from LWC and still secure.",
      objectives: [
        "Use `@AuraEnabled` and `cacheable=true` correctly.",
        "Enforce sharing and data access rules.",
        "Return data structures that LWC can consume cleanly."
      ],
      deepDive: [
        "Methods exposed to LWC must be static and annotated with `@AuraEnabled`. Read methods can use `cacheable=true`, but write methods must not.",
        "Security enforcement belongs in Apex when you go beyond standard LDS behavior. Strong answers mention `with sharing`, CRUD/FLS awareness, `WITH SECURITY_ENFORCED`, and `Security.stripInaccessible()`.",
        "Well-designed controller methods return focused data that the UI actually needs rather than dumping oversized records and making the front end sort it out."
      ],
      example: `public with sharing class AccountLwcController {
  @AuraEnabled(cacheable=true)
  public static List<Account> searchAccounts(String searchKey) {
    return [
      SELECT Id, Name, Industry
      FROM Account
      WHERE Name LIKE :('%' + searchKey + '%')
      WITH SECURITY_ENFORCED
      LIMIT 20
    ];
  }

  @AuraEnabled
  public static Id createAccount(String name) {
    Account acc = new Account(Name = name);
    insert acc;
    return acc.Id;
  }
}`,
      interview: "For LWC controllers, use static `@AuraEnabled` methods, `cacheable=true` only for read-only use cases, and enforce sharing plus field and object security on the server.",
      pitfalls: [
        "Adding DML to `cacheable=true` methods.",
        "Assuming UI hiding replaces Apex security.",
        "Returning too much unnecessary data."
      ],
      quiz: [
        {
          q: "Can an `@AuraEnabled(cacheable=true)` method perform DML?",
          options: ["Yes", "No", "Only in tests", "Only in sandbox"],
          answer: 1
        },
        {
          q: "Which phrase best improves an Apex security answer?",
          options: ["`with sharing` and FLS enforcement", "`renderedCallback`", "`@track`", "Custom CSS tokens"],
          answer: 0
        }
      ],
      exercise: {
        title: "Secure LWC controller mini-task",
        prompt: "Write one read-only `@AuraEnabled(cacheable=true)` method to search accounts and one non-cacheable method to create an account.",
        starter: `public with sharing class AccountLwcController {
  // add methods here
}`,
        checklist: [
          "Read method is static and cacheable.",
          "Write method is static and not cacheable.",
          "Uses a secure class declaration."
        ]
      }
    },
    {
      id: "apex-testing-integration",
      title: "Testing, Callouts, and Deployment Confidence",
      level: "Advanced",
      focus: "Validate behavior and support safe deployment and integration work.",
      objectives: [
        "Write behavior-based Apex tests with assertions.",
        "Use `Test.startTest()` and `Test.stopTest()` correctly.",
        "Explain integration callouts and Named Credentials."
      ],
      deepDive: [
        "Apex tests exist to verify behavior, not just reach 75 percent code coverage. A strong test sets up meaningful data, executes the behavior under test, and asserts the expected result clearly.",
        "For async or limit-sensitive code, `Test.startTest()` and `Test.stopTest()` help isolate execution and flush queued work where appropriate.",
        "For callouts, Named Credentials are the preferred way to manage endpoint and authentication configuration. They reduce hardcoding and make integrations safer and easier to maintain."
      ],
      example: `@isTest
private class AccountLwcControllerTest {
  @isTest
  static void createAccount_createsRecord() {
    Test.startTest();
    Id accountId = AccountLwcController.createAccount('Acme Practice');
    Test.stopTest();

    Account saved = [
      SELECT Id, Name
      FROM Account
      WHERE Id = :accountId
    ];
    System.assertEquals('Acme Practice', saved.Name);
  }
}

HttpRequest req = new HttpRequest();
req.setEndpoint('callout:ERP_Named_Credential/customers');
req.setMethod('GET');`,
      interview: "Say that good Apex tests validate business behavior with assertions, and mention Named Credentials for secure external callouts.",
      pitfalls: [
        "Talking only about coverage numbers.",
        "Writing tests with no meaningful assertions.",
        "Hardcoding external credentials in Apex."
      ],
      quiz: [
        {
          q: "What is the minimum org-wide Apex coverage needed for deployment?",
          options: ["50%", "60%", "75%", "100%"],
          answer: 2
        },
        {
          q: "What is the preferred way to store endpoint and auth settings for callouts?",
          options: ["Hardcoded strings", "Named Credentials", "CSS variables", "Local storage"],
          answer: 1
        }
      ],
      exercise: {
        title: "Write a meaningful test",
        prompt: "Create an Apex test method for an account creation service. Include `Test.startTest()`, `Test.stopTest()`, and one assertion that verifies the stored account name.",
        starter: `@isTest
private class AccountServiceTest {
  @isTest
  static void testCreateAccount() {
    // write test here
  }
}`,
        checklist: [
          "Uses `@isTest`.",
          "Uses `Test.startTest()` and `Test.stopTest()`.",
          "Includes a real assertion on the resulting data."
        ]
      }
    }
  ],
  finalTest: {
    multipleChoice: [
      {
        q: "A child LWC needs to notify its parent that a row was selected. What is the best default pattern?",
        options: ["Lightning Message Service", "CustomEvent", "SOQL", "Queueable Apex"],
        answer: 1,
        topic: "LWC communication"
      },
      {
        q: "Which Apex pattern best avoids governor issues in triggers?",
        options: ["SOQL inside loops", "Thin trigger plus handler plus map-based processing", "DML for each record", "Static booleans everywhere"],
        answer: 1,
        topic: "Bulkification"
      },
      {
        q: "What is the right choice for a read-only reactive list in LWC?",
        options: ["Imperative Apex only", "`@wire` with cacheable Apex", "DML in `renderedCallback`", "CSS custom properties"],
        answer: 1,
        topic: "Wire data"
      },
      {
        q: "Which async option is usually the best modern default over Future?",
        options: ["Queueable", "Getter", "Template directive", "Custom label"],
        answer: 0,
        topic: "Async Apex"
      },
      {
        q: "Which phrase best strengthens a Salesforce security answer?",
        options: ["Hide it in the UI", "`with sharing` plus CRUD/FLS enforcement", "Use more CSS", "Use only client-side validation"],
        answer: 1,
        topic: "Security"
      },
      {
        q: "Why is immutable array update useful in LWC?",
        options: ["It updates js-meta.xml", "It helps predictable rerendering", "It changes sharing rules", "It avoids test classes"],
        answer: 1,
        topic: "Reactivity"
      }
    ],
    codingPrompts: [
      {
        id: "final-lwc-search",
        title: "LWC Search Component",
        prompt: "Write the JavaScript for an LWC search component that debounces input and uses a wired Apex method `searchAccounts` with reactive `searchKey`."
      },
      {
        id: "final-lwc-event",
        title: "Child to Parent Event",
        prompt: "Write child-side code to dispatch `selectrecord` with `recordId` in `detail`, then write the parent template listener."
      },
      {
        id: "final-apex-trigger",
        title: "Bulk-Safe Trigger Pattern",
        prompt: "Write a trigger plus handler outline that updates parent Account descriptions based on Contact changes without SOQL in loops."
      },
      {
        id: "final-apex-controller-test",
        title: "Secure Controller + Test",
        prompt: "Sketch an `@AuraEnabled(cacheable=true)` Apex method for account search and one test method that asserts behavior."
      }
    ]
  }
};

const ADDITIONAL_LWC_TOPICS = [
  {
    id: "lwc-template-directives",
    title: "Template Directives and List Rendering",
    level: "Foundation",
    focus: "Control what the template renders and how repeated records are tracked.",
    objectives: [
      "Use `lwc:if`, `lwc:elseif`, and `lwc:else` correctly.",
      "Render arrays with `for:each` and stable keys.",
      "Explain why getters are often used for conditional display flags."
    ],
    deepDive: [
      "Template directives are how an LWC decides what appears on screen at runtime. The core skill is not memorizing directive names but deciding which state should drive the UI and how that state is exposed cleanly from JavaScript.",
      "Loop rendering with `for:each` requires a stable key so the framework can track DOM nodes accurately. In Salesforce projects, the record `Id` is usually the correct key because indexes become unsafe when sorting, filtering, or inserting rows.",
      "Strong component design often uses getters such as `hasRecords`, `showSpinner`, or `showEmptyState` rather than scattering complicated conditional logic through HTML."
    ],
    example: `<template>
  <template lwc:if={isLoading}>
    <lightning-spinner alternative-text="Loading"></lightning-spinner>
  </template>
  <template lwc:elseif={hasAccounts}>
    <template for:each={accounts} for:item="account">
      <p key={account.Id}>{account.Name}</p>
    </template>
  </template>
  <template lwc:else>
    <p>No accounts found.</p>
  </template>
</template>`,
    interview: "Use conditional directives for state-driven UI and `for:each` with stable unique keys, usually Salesforce record ids, when rendering lists.",
    pitfalls: [
      "Using the array index as a key when the list can change.",
      "Trying to place complex business logic directly in the template.",
      "Forgetting to provide a clear empty-state branch."
    ],
    quiz: [
      {
        q: "What is the safest key to use in a record list?",
        options: ["Array index", "Random number", "Stable record Id", "CSS class name"],
        answer: 2
      },
      {
        q: "Which directive is used for the first conditional branch in modern LWC templates?",
        options: ["if:true", "lwc:if", "aura:if", "render:if"],
        answer: 1
      }
    ],
    exercise: {
      title: "Conditional rendering drill",
      prompt: "Write template code that shows a spinner while loading, a repeated list of contacts when data exists, and an empty-state message when the list is empty.",
      starter: `<template>
  <!-- write conditional rendering here -->
</template>`,
      checklist: [
        "Uses `lwc:if` and `lwc:else` branches.",
        "Uses `for:each` with a stable key.",
        "Shows a meaningful empty state."
      ]
    },
    subtopics: [
      "Conditional rendering directives.",
      "Loop rendering with `for:each`.",
      "Stable keys and DOM diffing.",
      "Empty, loading, and data-present states.",
      "Getter-driven display flags."
    ],
    keyTerms: ["lwc:if", "lwc:else", "for:each", "key", "empty state"],
    scenarios: [
      "A screen should swap between spinner, table, and no-data message.",
      "A datatable-like custom list rerenders incorrectly because index was used as key."
    ]
  },
  {
    id: "lwc-composition-slots",
    title: "Component Composition, Slots, and Reuse",
    level: "Core",
    focus: "Design reusable components with parent-child composition and flexible content insertion.",
    objectives: [
      "Explain component composition in LWC.",
      "Use slots for flexible child content placement.",
      "Build smaller reusable UI pieces instead of one giant component."
    ],
    deepDive: [
      "Good LWC architecture is about composition. Large enterprise screens become maintainable when broken into focused child components such as filters, result tables, summary cards, and action bars.",
      "Slots let a parent inject markup into a child-defined placeholder, which is useful for generic layout components like cards, panels, wrappers, and modal shells.",
      "Reusable design also means deciding what belongs in the public API, what should remain internal, and how to avoid coupling child components too tightly to one parent."
    ],
    example: `<!-- infoPanel.html -->
<template>
  <section class="panel">
    <header>{title}</header>
    <slot></slot>
  </section>
</template>

<!-- parent.html -->
<c-info-panel title="Account Notes">
  <p>Projected renewal in Q4.</p>
</c-info-panel>`,
    interview: "Composition keeps components small and reusable. Slots are useful when the child defines structure but the parent should provide custom content.",
    pitfalls: [
      "Making a child too specific to one page.",
      "Using a slot when a simple `@api` property would be clearer.",
      "Packing too much logic into a presentational wrapper."
    ],
    quiz: [
      {
        q: "What is the main purpose of a slot?",
        options: ["Run Apex", "Insert parent-provided content into child layout", "Create metadata targets", "Share CSS globally"],
        answer: 1
      }
    ],
    exercise: {
      title: "Reusable wrapper practice",
      prompt: "Sketch a generic card component that exposes a `title` property and accepts inner content with a slot.",
      starter: `<!-- reusableCard.html -->
<template>
  <!-- write card wrapper with slot -->
</template>`,
      checklist: [
        "Defines a slot in the child.",
        "Uses a public property for title.",
        "Keeps the wrapper generic."
      ]
    },
    subtopics: [
      "Parent-child composition.",
      "Presentational versus container components.",
      "Default slot usage.",
      "Public API design for reusable components.",
      "Avoiding monolithic component design."
    ],
    keyTerms: ["composition", "slot", "@api", "container component", "presentational component"],
    scenarios: [
      "A design system needs one reusable panel component used in many pages.",
      "A component tree is hard to maintain because all UI is inside one file."
    ]
  },
  {
    id: "lwc-wire-adapters",
    title: "UI API Wire Adapters and Record Data",
    level: "Very Important",
    focus: "Use platform-provided wire adapters for records, object metadata, and picklists.",
    objectives: [
      "Use `getRecord` and `getFieldValue` for record access.",
      "Understand object metadata and picklist wire adapters.",
      "Choose UI API when it fits better than custom Apex."
    ],
    deepDive: [
      "Salesforce provides UI API wire adapters that remove the need for many simple controller methods. This is an important platform-native skill because it reduces custom Apex, respects security, and leverages client caching.",
      "Record adapters are ideal for fetching known fields, while metadata adapters support dynamic UIs that need object info, record type data, or picklist values.",
      "A mature learner should know the difference between 'I need a custom query' and 'the platform already has a secure data adapter for this use case.'"
    ],
    example: `import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';

export default class RecordName extends LightningElement {
  @api recordId;

  @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD] })
  account;

  get name() {
    return getFieldValue(this.account.data, NAME_FIELD);
  }
}`,
    interview: "Use UI API wire adapters when the platform already supports your record or metadata need, because it reduces custom Apex and aligns with built-in security and caching.",
    pitfalls: [
      "Writing Apex for simple field retrieval that `getRecord` could handle.",
      "Not checking whether `data` is available before reading values.",
      "Confusing UI API adapters with imperative Apex patterns."
    ],
    quiz: [
      {
        q: "Which adapter is commonly used to read record fields without custom Apex?",
        options: ["`getRecord`", "`enqueueJob`", "`CustomEvent`", "`NavigationMixin`"],
        answer: 0
      }
    ],
    exercise: {
      title: "UI API mini-task",
      prompt: "Write a component that reads the `Account.Name` field for a given `recordId` using `getRecord` and a getter.",
      starter: `import { LightningElement, api, wire } from 'lwc';
// complete imports and wire logic`,
      checklist: [
        "Uses `getRecord`.",
        "Uses `getFieldValue` or equivalent pattern.",
        "Accepts `recordId` via `@api`."
      ]
    },
    subtopics: [
      "Record wire adapters.",
      "Object metadata adapters.",
      "Picklist value adapters.",
      "Caching and security benefits of UI API.",
      "When to choose UI API instead of Apex."
    ],
    keyTerms: ["getRecord", "getObjectInfo", "getPicklistValues", "UI API", "schema import"],
    scenarios: [
      "A record page component needs only a handful of fields.",
      "A form needs dynamic picklist values based on record type."
    ]
  },
  {
    id: "lwc-forms-validation",
    title: "Forms, Validation, and User Input Handling",
    level: "Core",
    focus: "Build reliable forms with validation and clear feedback.",
    objectives: [
      "Work with Lightning base inputs and forms.",
      "Validate fields before save.",
      "Provide clear feedback for invalid or incomplete user input."
    ],
    deepDive: [
      "A good form experience is not just about collecting values. It includes input handling, validation, disabled states, submission flow, error display, and success feedback.",
      "LWC supports both custom validation flows and platform components such as `lightning-record-edit-form` or standard base input elements. The right choice depends on how custom the behavior needs to be.",
      "Practical interview answers should mention `reportValidity()`, `checkValidity()`, and preventing save when user input fails required checks."
    ],
    example: `handleSave() {
  const inputs = [...this.template.querySelectorAll('lightning-input')];
  const isValid = inputs.every((input) => {
    input.reportValidity();
    return input.checkValidity();
  });

  if (!isValid) {
    return;
  }

  // proceed with save
}`,
    interview: "Strong LWC forms validate before save, show inline feedback, and avoid sending obviously invalid data to Apex.",
    pitfalls: [
      "Saving without client-side validation.",
      "Ignoring disabled or loading states during submit.",
      "Providing no user feedback on failed input."
    ],
    quiz: [
      {
        q: "Which methods are commonly used to surface and check input validity?",
        options: ["`render()` and `compile()`", "`reportValidity()` and `checkValidity()`", "`push()` and `pop()`", "`publish()` and `subscribe()`"],
        answer: 1
      }
    ],
    exercise: {
      title: "Validation flow practice",
      prompt: "Write a `handleSave` function that checks all `lightning-input` fields for validity before making an Apex call.",
      starter: `handleSave() {
  // validate inputs here
}`,
      checklist: [
        "Queries the input elements.",
        "Calls `reportValidity()`.",
        "Stops save if validation fails."
      ]
    },
    subtopics: [
      "Base input components.",
      "Validation flow before save.",
      "Disabled and loading states during submit.",
      "Inline user feedback.",
      "Custom form versus record form approach."
    ],
    keyTerms: ["reportValidity", "checkValidity", "lightning-input", "submit flow", "validation"],
    scenarios: [
      "A user clicks Save with missing required fields.",
      "A custom modal form must block duplicate submit clicks."
    ]
  },
  {
    id: "lwc-navigation-actions",
    title: "Navigation, Quick Actions, and Workspace Behaviors",
    level: "Scenario",
    focus: "Move users to the right Salesforce destinations and fit components into page actions.",
    objectives: [
      "Understand common navigation use cases in LWC.",
      "Explain quick action and record-page contexts.",
      "Design components that fit Salesforce user flows."
    ],
    deepDive: [
      "LWC components often live inside a larger Salesforce workflow: record pages, utility items, quick actions, flow screens, or console-like experiences. Good component design respects the context the user is already in.",
      "Navigation and actions are less about syntax memorization and more about choosing the right target: view a record, edit a record, open a list, launch a tab, or close a modal action after save.",
      "Interview answers improve when they connect navigation decisions with user productivity rather than treating them as isolated framework features."
    ],
    example: `// Example idea:
// Navigate to a record after creation and show a success toast.
// In a quick action, close the action after save completes.`,
    interview: "Explain navigation as part of user workflow. A good LWC does not just save data; it also returns the user to the right place with clear feedback.",
    pitfalls: [
      "Ignoring the page context where the component is hosted.",
      "Saving data without guiding the user afterward.",
      "Treating quick actions like regular standalone pages."
    ],
    quiz: [
      {
        q: "Why is page context important for navigation decisions?",
        options: ["It changes CSS only", "It affects what action or destination makes sense for the user", "It removes governor limits", "It replaces metadata targets"],
        answer: 1
      }
    ],
    exercise: {
      title: "User flow design note",
      prompt: "Write a short plan for an LWC quick action that creates a Contact, shows success feedback, and returns the user to a useful page state.",
      starter: `Flow plan:
- Before save:
- After save:
- User feedback:` ,
      checklist: [
        "Mentions page context.",
        "Mentions success feedback.",
        "Mentions post-save navigation or closure."
      ]
    },
    subtopics: [
      "Record-page context.",
      "Quick action behavior.",
      "Post-save user flow.",
      "Navigation decisions by scenario.",
      "User productivity considerations."
    ],
    keyTerms: ["navigation", "quick action", "record page", "user flow", "context"],
    scenarios: [
      "A record action should create data and then close cleanly.",
      "A list item click should open the correct target page."
    ]
  },
  {
    id: "lwc-static-resources",
    title: "Static Resources and Third-Party Libraries",
    level: "Advanced",
    focus: "Load reusable assets and reason about when external libraries are worth it.",
    objectives: [
      "Understand what static resources are used for in LWC.",
      "Explain the tradeoff of bringing third-party libraries into Salesforce UI.",
      "Think through loading and integration concerns."
    ],
    deepDive: [
      "Static resources store client-side assets such as images, styles, utility code, or third-party libraries. This is useful when the platform does not provide the exact capability you need out of the box.",
      "However, adding external libraries should be a deliberate choice. Every dependency affects bundle complexity, loading behavior, maintenance, and future compatibility.",
      "A strong engineering answer weighs reuse against platform-native options and keeps the dependency footprint as small as practical."
    ],
    example: `// Typical pattern:
// import libraryUrl from '@salesforce/resourceUrl/someLibrary';
// loadScript(this, libraryUrl + '/bundle.js');`,
    interview: "Use static resources thoughtfully. Prefer platform-native solutions first, and introduce external libraries only when they add clear value.",
    pitfalls: [
      "Adding a heavy library for a small UI need.",
      "Not considering asynchronous loading behavior.",
      "Ignoring maintainability and upgrade cost."
    ],
    quiz: [
      {
        q: "What is a strong default mindset for third-party libraries in LWC?",
        options: ["Add many by default", "Prefer platform-native solutions first", "Use them only in Apex", "Avoid all static resources"],
        answer: 1
      }
    ],
    exercise: {
      title: "Dependency decision drill",
      prompt: "Write a short decision note explaining when you would choose a static resource library versus a built-in Lightning base component.",
      starter: `Choose a static resource when:
- 

Prefer base components when:
- `,
      checklist: [
        "Mentions dependency cost.",
        "Mentions built-in platform alternatives.",
        "Mentions loading or maintenance concerns."
      ]
    },
    subtopics: [
      "Static resource purpose.",
      "Loading external assets.",
      "Dependency tradeoffs.",
      "Platform-native alternatives.",
      "Maintainability and bundle weight."
    ],
    keyTerms: ["static resource", "loadScript", "loadStyle", "dependency", "bundle weight"],
    scenarios: [
      "A charting need may require an external library.",
      "A built-in base component may already satisfy the requirement without extra assets."
    ]
  },
  {
    id: "lwc-lms-advanced",
    title: "Lightning Message Service in Depth",
    level: "Advanced",
    focus: "Use cross-component messaging responsibly and understand where it fits.",
    objectives: [
      "Explain the publish-subscribe model in LMS.",
      "Know when LMS is appropriate versus over-engineered.",
      "Think through message payload design and lifecycle handling."
    ],
    deepDive: [
      "Lightning Message Service helps unrelated components coordinate through a shared message channel. It is valuable for cross-region page communication, but it should not replace simpler parent-child patterns.",
      "Well-designed message contracts are small and focused. They carry only the data needed by subscribers and avoid turning the channel into an unstructured event dump.",
      "Advanced understanding also includes thinking about subscription timing, teardown, and the long-term maintainability of shared messaging contracts."
    ],
    example: `// Conceptual flow:
// Publisher -> message channel -> subscriber`,
    interview: "Use LMS for unrelated components that need cross-page-region communication. For directly related components, simpler APIs are usually better.",
    pitfalls: [
      "Using LMS for every communication path.",
      "Publishing oversized payloads.",
      "Forgetting that messaging contracts need clear ownership."
    ],
    quiz: [
      {
        q: "When is LMS usually the better choice?",
        options: ["Parent-child communication only", "Unrelated components that still need coordination", "CSS theming", "Apex test setup"],
        answer: 1
      }
    ],
    exercise: {
      title: "Messaging design note",
      prompt: "Describe a scenario where two unrelated components need LMS and list the exact data you would publish.",
      starter: `Scenario:
- 

Payload:
- `,
      checklist: [
        "Uses an unrelated-component scenario.",
        "Keeps payload focused.",
        "Explains why parent-child communication is not enough."
      ]
    },
    subtopics: [
      "Message channels.",
      "Publisher and subscriber roles.",
      "Payload design.",
      "When LMS is justified.",
      "Maintainability of shared message contracts."
    ],
    keyTerms: ["LMS", "message channel", "publish", "subscribe", "payload"],
    scenarios: [
      "A filter panel and a dashboard tile need to coordinate without direct hierarchy.",
      "A utility bar component should react to changes from a record-page component."
    ]
  },
  {
    id: "lwc-jest-testing",
    title: "LWC Testing with Jest",
    level: "Advanced",
    focus: "Think in terms of component behavior and DOM verification.",
    objectives: [
      "Explain what LWC Jest tests usually verify.",
      "Understand rendering, events, and DOM assertion patterns.",
      "Connect front-end testing with deployment confidence."
    ],
    deepDive: [
      "Jest tests for LWC usually focus on component behavior, not implementation trivia. Useful tests check what renders, how the DOM changes, what events fire, and how the component reacts to mocked data or user actions.",
      "A good mental model is: set up the component, attach it to the DOM, provide input or simulate interaction, then assert the user-visible outcome.",
      "Even when the current repository is a static learning site, understanding LWC testing improves interview performance and engineering maturity."
    ],
    example: `// Typical test idea:
// createElement('c-my-component', { is: MyComponent });
// append to document.body
// set props or simulate input
// assert rendered DOM output`,
    interview: "Good LWC tests verify rendered output, user interaction, and event behavior rather than chasing coverage alone.",
    pitfalls: [
      "Testing internal implementation details instead of user-visible behavior.",
      "Ignoring event dispatch and DOM state changes.",
      "Talking only about coverage instead of assertions."
    ],
    quiz: [
      {
        q: "What is a strong default target for LWC Jest tests?",
        options: ["Metadata XML formatting", "Rendered behavior and interaction outcomes", "SOQL optimization", "Governor limits"],
        answer: 1
      }
    ],
    exercise: {
      title: "Test planning drill",
      prompt: "Write a test plan for an LWC with an input and save button. List what you would render, click, and assert.",
      starter: `Test steps:
1.
2.
3.`,
      checklist: [
        "Mentions DOM rendering.",
        "Mentions simulating user interaction.",
        "Mentions asserting user-visible outcomes."
      ]
    },
    subtopics: [
      "Rendering tests.",
      "Interaction tests.",
      "DOM assertions.",
      "Mocked data inputs.",
      "Behavior versus coverage mindset."
    ],
    keyTerms: ["Jest", "DOM assertion", "createElement", "mock", "interaction test"],
    scenarios: [
      "A save button should dispatch an event when input is valid.",
      "A component should rerender after new data arrives."
    ]
  }
];

const ADDITIONAL_APEX_TOPICS = [
  {
    id: "apex-collections",
    title: "Collections, Maps, and Data Shaping",
    level: "Foundation",
    focus: "Use lists, sets, and maps fluently for real Salesforce business logic.",
    objectives: [
      "Differentiate lists, sets, and maps.",
      "Use collections to avoid repeated queries and expensive loops.",
      "Shape incoming data into efficient lookup structures."
    ],
    deepDive: [
      "Collections are central to Apex design because most Salesforce logic processes multiple records in one transaction. Understanding collection behavior is part of writing bulk-safe code, not just language syntax.",
      "Sets are ideal for unique ids, maps are ideal for lookups by id or key, and lists are ideal when you need ordered records or DML-ready batches.",
      "Many high-quality trigger and service implementations are really data-shaping exercises: gather ids, query once, map results, then process with minimal repeated work."
    ],
    example: `Set<Id> accountIds = new Set<Id>();
Map<Id, Account> accountMap = new Map<Id, Account>();
List<Contact> newContacts = new List<Contact>();`,
    interview: "Apex collections are critical because they enable bulk-safe processing, fast lookups, and clean data orchestration inside governor-limited transactions.",
    pitfalls: [
      "Using nested loops where a map lookup would be cleaner.",
      "Not deduplicating ids before querying.",
      "Treating collections as beginner syntax instead of a design tool."
    ],
    quiz: [
      {
        q: "Which collection is best for a fast lookup by record id?",
        options: ["List", "Map", "String", "Decimal"],
        answer: 1
      }
    ],
    exercise: {
      title: "Collection choice drill",
      prompt: "Write a short example that collects Account ids into a set and then stores queried accounts in a map.",
      starter: `Set<Id> accountIds = new Set<Id>();
// continue here`,
      checklist: [
        "Uses a set for unique ids.",
        "Uses a map for lookup.",
        "Connects the pattern to later business logic."
      ]
    },
    subtopics: [
      "Lists, sets, and maps.",
      "Lookup-friendly code design.",
      "Deduplicating ids before queries.",
      "Data shaping before business logic.",
      "Collection use in triggers and services."
    ],
    keyTerms: ["List", "Set", "Map", "lookup", "data shaping"],
    scenarios: [
      "A trigger needs parent records for many child rows.",
      "A service must avoid repeated nested scans."
    ]
  },
  {
    id: "apex-order-execution",
    title: "Order of Execution and Transaction Behavior",
    level: "Very Important",
    focus: "Understand what Salesforce does around your code during save operations.",
    objectives: [
      "Explain why order of execution matters for debugging and design.",
      "Connect validation rules, flows, triggers, and automation behavior at a high level.",
      "Reason about transaction outcomes when multiple automations interact."
    ],
    deepDive: [
      "Many Salesforce bugs are not caused by one line of Apex alone; they come from interaction between validation rules, flows, triggers, workflow-like automation, assignment logic, and database save behavior.",
      "Understanding order of execution helps you explain why a field value changed unexpectedly, why recursion happened, or why an update appears to run more than once.",
      "Even at interview level, you do not always need to recite every platform step from memory. What matters is showing that Apex exists inside a broader automation pipeline."
    ],
    example: `// Conceptual topic:
// Validation -> before triggers -> save -> after triggers -> post-commit work`,
    interview: "Order of execution matters because Apex does not run in isolation. It interacts with validation, flows, and other automation inside the same transaction lifecycle.",
    pitfalls: [
      "Debugging a trigger without considering surrounding automation.",
      "Assuming one DML statement means one simple code path.",
      "Ignoring transaction-wide side effects."
    ],
    quiz: [
      {
        q: "Why is order of execution important?",
        options: ["Only for CSS", "Because many automations run around Apex in the same transaction", "It changes API names", "It replaces tests"],
        answer: 1
      }
    ],
    exercise: {
      title: "Debugging reasoning note",
      prompt: "Write a short explanation of how order of execution can cause a field value to change more than once during a save.",
      starter: `Reason:
- `,
      checklist: [
        "Mentions multiple automation layers.",
        "Mentions transaction context.",
        "Connects it to debugging."
      ]
    },
    subtopics: [
      "Save lifecycle overview.",
      "Interaction between Apex and automation.",
      "Recursion and repeated updates.",
      "Debugging transaction behavior.",
      "Post-commit thinking."
    ],
    keyTerms: ["order of execution", "transaction", "validation", "flow", "post-commit"],
    scenarios: [
      "A field value is unexpectedly overwritten during save.",
      "A trigger seems to fire multiple times in one user action."
    ]
  },
  {
    id: "apex-exceptions",
    title: "Exception Handling and Error Strategy",
    level: "Core",
    focus: "Handle errors cleanly and communicate failures safely.",
    objectives: [
      "Use try-catch thoughtfully.",
      "Differentiate user-facing versus internal errors.",
      "Design error handling that supports debugging and stability."
    ],
    deepDive: [
      "Error handling in Apex is not just about wrapping code in try-catch. It is about deciding what can fail, what should be surfaced, what should be logged, and whether partial success is acceptable.",
      "Some operations should fail loudly so the transaction rolls back, while others may benefit from safe collection of row-level errors or a user-friendly message.",
      "Strong engineers think about error boundaries, supportability, and how exceptions affect the entire transaction."
    ],
    example: `try {
  update accountsToSave;
} catch (DmlException ex) {
  System.debug(ex.getMessage());
  throw ex;
}`,
    interview: "Use exception handling intentionally. Catch what you can handle meaningfully, preserve debugging context, and avoid swallowing important transaction failures silently.",
    pitfalls: [
      "Catching exceptions and doing nothing useful.",
      "Hiding the real cause of failure.",
      "Using try-catch instead of fixing predictable validation issues."
    ],
    quiz: [
      {
        q: "What is a poor exception-handling practice?",
        options: ["Handling an expected DML failure clearly", "Swallowing an exception without action or context", "Logging debug context", "Failing the transaction when necessary"],
        answer: 1
      }
    ],
    exercise: {
      title: "Error handling sketch",
      prompt: "Write a small `try-catch` example around a DML operation and explain what should happen if the save fails.",
      starter: `try {
  // DML here
} catch (DmlException ex) {
  // handle here
}`,
      checklist: [
        "Catches a meaningful exception type.",
        "Does not hide the error silently.",
        "Explains transaction impact."
      ]
    },
    subtopics: [
      "Try-catch structure.",
      "DML and query exception patterns.",
      "User-facing versus internal error handling.",
      "Rollback implications.",
      "Supportable debug behavior."
    ],
    keyTerms: ["try-catch", "DmlException", "rollback", "error strategy", "logging"],
    scenarios: [
      "A bulk save partially fails and the user needs clear feedback.",
      "A callout or query path may throw a runtime exception."
    ]
  },
  {
    id: "apex-sharing-security-modes",
    title: "Sharing Modes, CRUD, FLS, and User Context",
    level: "Critical",
    focus: "Understand the security execution model beyond a single keyword.",
    objectives: [
      "Differentiate `with sharing`, `without sharing`, and `inherited sharing` at a high level.",
      "Connect record access with CRUD and FLS enforcement.",
      "Explain user mode versus privileged execution thinking."
    ],
    deepDive: [
      "Apex security is layered. Record-level access, object permissions, field permissions, and execution context all matter, and strong answers discuss them separately rather than treating 'with sharing' as a complete solution.",
      "Sharing keywords determine record access behavior, while CRUD and FLS determine whether objects and fields should be visible or editable.",
      "Real secure design means thinking deliberately about who the code runs for, what data it exposes, and which operations should be restricted or filtered."
    ],
    example: `public inherited sharing class OpportunityService {
  public static List<Opportunity> getVisibleOpenDeals() {
    return [SELECT Id, Name FROM Opportunity LIMIT 20];
  }
}`,
    interview: "Security requires more than `with sharing`. You must reason about record sharing, CRUD, FLS, and the effective execution context of the code path.",
    pitfalls: [
      "Assuming `with sharing` covers field-level security.",
      "Returning fields the UI does not need.",
      "Not understanding the difference between record access and field access."
    ],
    quiz: [
      {
        q: "What does `with sharing` mainly influence?",
        options: ["CSS scope", "Record-level sharing behavior", "Test coverage", "SOQL syntax"],
        answer: 1
      }
    ],
    exercise: {
      title: "Security explanation drill",
      prompt: "Write a short answer explaining why `with sharing` alone is not enough for secure Apex.",
      starter: `Security answer:
- `,
      checklist: [
        "Mentions record sharing.",
        "Mentions CRUD and FLS separately.",
        "Explains layered security thinking."
      ]
    },
    subtopics: [
      "Sharing keywords.",
      "Record access versus field access.",
      "CRUD and FLS enforcement.",
      "Execution context reasoning.",
      "Least-privilege data exposure."
    ],
    keyTerms: ["with sharing", "without sharing", "inherited sharing", "CRUD", "FLS"],
    scenarios: [
      "A service returns records the user should not see.",
      "A field should be stripped before insert or update."
    ]
  },
  {
    id: "apex-rest-callouts",
    title: "REST Callouts, Named Credentials, and External Integration",
    level: "Advanced",
    focus: "Understand how Apex connects safely to external systems.",
    objectives: [
      "Describe the basic callout flow.",
      "Explain why Named Credentials are preferred.",
      "Connect callouts with async patterns and transaction design."
    ],
    deepDive: [
      "Apex integrations often use HTTP callouts to external services. The real engineering challenge is not only sending a request but doing so safely, reliably, and in the correct transaction context.",
      "Named Credentials improve maintainability and security by centralizing endpoint and authentication management instead of scattering secrets through code.",
      "Trigger-based integrations frequently need async handoff to avoid transaction timing issues and keep the user save flow responsive."
    ],
    example: `HttpRequest req = new HttpRequest();
req.setEndpoint('callout:ERP_Named_Credential/customers');
req.setMethod('GET');
HttpResponse res = new Http().send(req);`,
    interview: "Use Named Credentials for endpoint and auth management, and pair callouts with appropriate async patterns when they should not block the main transaction.",
    pitfalls: [
      "Hardcoding endpoints and credentials.",
      "Ignoring transaction timing for trigger-driven callouts.",
      "Treating integrations as just request syntax."
    ],
    quiz: [
      {
        q: "Why are Named Credentials preferred?",
        options: ["They replace SOQL", "They centralize endpoint and auth management securely", "They are only for CSS", "They remove all tests"],
        answer: 1
      }
    ],
    exercise: {
      title: "Integration design note",
      prompt: "Write a short plan for a trigger-initiated integration that should send account data to an external system.",
      starter: `Plan:
- Callout timing:
- Security:
- Async approach:`,
      checklist: [
        "Mentions Named Credentials.",
        "Mentions async handoff.",
        "Mentions transaction safety."
      ]
    },
    subtopics: [
      "HTTP callout flow.",
      "Named Credentials.",
      "Async callout considerations.",
      "External integration safety.",
      "Transaction-aware integration design."
    ],
    keyTerms: ["HTTP callout", "Named Credential", "endpoint", "authentication", "async integration"],
    scenarios: [
      "An Account save should notify an ERP system.",
      "A long-running callout should not block a user transaction."
    ]
  },
  {
    id: "apex-platform-events",
    title: "Platform Events and Event-Driven Thinking",
    level: "Advanced",
    focus: "Understand asynchronous event-driven integration patterns on Salesforce.",
    objectives: [
      "Explain what platform events solve at a high level.",
      "Differentiate event-driven design from direct synchronous logic.",
      "Know where platform events fit into scalable architecture discussions."
    ],
    deepDive: [
      "Platform events support decoupled, event-driven architecture. Instead of one process directly invoking another immediately, a publisher can emit an event and subscribers can react independently.",
      "This is useful when systems or modules should not be tightly bound to one synchronous transaction, especially in integration-heavy environments.",
      "Even if a project does not use platform events yet, being able to explain when they help shows architectural depth beyond basic trigger coding."
    ],
    example: `// Concept:
// Publish an event after a business milestone, then let subscribers process it independently.`,
    interview: "Platform events are useful when you want looser coupling and asynchronous reaction to business events instead of direct synchronous chaining.",
    pitfalls: [
      "Using events when a simple direct flow is enough.",
      "Ignoring the need for clear event contracts.",
      "Confusing event-driven architecture with regular trigger logic."
    ],
    quiz: [
      {
        q: "What is a major benefit of platform events?",
        options: ["Tighter coupling", "Decoupled asynchronous reactions", "Replacing HTML templates", "Removing object permissions"],
        answer: 1
      }
    ],
    exercise: {
      title: "Architecture reasoning task",
      prompt: "Describe a business scenario where publishing an event is better than calling another process synchronously.",
      starter: `Scenario:
- 

Why event-driven helps:
- `,
      checklist: [
        "Uses decoupled communication reasoning.",
        "Mentions asynchronous benefit.",
        "Uses a realistic business case."
      ]
    },
    subtopics: [
      "Event-driven design.",
      "Decoupling benefits.",
      "Publisher-subscriber thinking.",
      "Asynchronous architecture choices.",
      "When platform events are worth introducing."
    ],
    keyTerms: ["platform event", "publisher", "subscriber", "decoupling", "event-driven"],
    scenarios: [
      "An order-complete event should notify multiple downstream systems.",
      "One business action should fan out into multiple independent processes."
    ]
  },
  {
    id: "apex-rest-services",
    title: "Apex REST Services and API Exposure",
    level: "Advanced",
    focus: "Understand when Apex exposes services outward instead of only consuming them.",
    objectives: [
      "Explain why custom Apex REST endpoints may be created.",
      "Think about payload shape, security, and maintainability.",
      "Differentiate internal business logic from API exposure layers."
    ],
    deepDive: [
      "Apex is not only for consuming external services; it can also expose custom endpoints when Salesforce must act as a provider. This is common when external systems need controlled access to Salesforce-driven business processes.",
      "Good API design keeps the service contract focused and stable rather than exposing raw internal structure carelessly.",
      "A strong answer mentions authentication, authorization, payload discipline, error handling, and separating API layer code from core service logic."
    ],
    example: `// Conceptual topic:
// Expose a REST resource that accepts a request, validates it, and delegates to a service class.`,
    interview: "Custom Apex REST endpoints are useful when Salesforce must expose business operations outward in a controlled, secure, maintainable way.",
    pitfalls: [
      "Putting all business logic directly in the endpoint class.",
      "Exposing more data than consumers need.",
      "Skipping clear security and contract design."
    ],
    quiz: [
      {
        q: "What is a strong design principle for Apex REST services?",
        options: ["Expose raw internal structures directly", "Keep the contract focused and delegate to service logic", "Replace all triggers", "Avoid authentication entirely"],
        answer: 1
      }
    ],
    exercise: {
      title: "API design note",
      prompt: "Write a short design note for an Apex REST endpoint that creates a case from an external system request.",
      starter: `Endpoint design:
- Request shape:
- Validation:
- Service delegation:`,
      checklist: [
        "Mentions focused payload design.",
        "Mentions security or auth concern.",
        "Mentions delegation to service logic."
      ]
    },
    subtopics: [
      "Apex as an API provider.",
      "Request and response contract design.",
      "Endpoint versus service-layer separation.",
      "Security and exposure concerns.",
      "Maintainable outward-facing APIs."
    ],
    keyTerms: ["REST resource", "API contract", "service layer", "payload", "authentication"],
    scenarios: [
      "An external portal submits requests into Salesforce.",
      "A back-office system needs a controlled create operation."
    ]
  },
  {
    id: "apex-test-patterns",
    title: "Advanced Test Patterns and Test Data Strategy",
    level: "Advanced",
    focus: "Go beyond basic coverage into maintainable, high-signal testing.",
    objectives: [
      "Design tests that are readable and behavior-focused.",
      "Understand reusable test data strategy at a high level.",
      "Think through positive, negative, bulk, and security scenarios."
    ],
    deepDive: [
      "Good Apex tests are intentional. They set up realistic data, run a focused behavior path, and assert the most important business outcomes clearly.",
      "As applications grow, repeated test setup becomes expensive and hard to maintain. Thoughtful test data patterns and helper design can improve clarity while keeping tests isolated.",
      "High-value test suites include bulk scenarios, security-sensitive scenarios, and failure cases rather than only happy-path examples."
    ],
    example: `@isTest
private class OpportunityServiceTest {
  @isTest
  static void updatesStageForQualifiedDeal() {
    // arrange
    // act
    // assert
  }
}`,
    interview: "Strong Apex tests verify behavior across happy path, edge cases, and bulk scenarios. Coverage matters, but quality of assertions matters more.",
    pitfalls: [
      "Writing only happy-path tests.",
      "Repeating noisy setup in every method without strategy.",
      "Treating assertions as optional."
    ],
    quiz: [
      {
        q: "Which test suite is usually stronger?",
        options: ["Only happy-path coverage", "Behavior-focused tests including bulk and failure cases", "No assertions but high coverage", "Only UI screenshots"],
        answer: 1
      }
    ],
    exercise: {
      title: "Test suite planning",
      prompt: "List the test cases you would create for a bulk-safe trigger handler that updates parent records.",
      starter: `Test cases:
1.
2.
3.`,
      checklist: [
        "Includes bulk scenario.",
        "Includes failure or edge scenario.",
        "Includes assertion-oriented thinking."
      ]
    },
    subtopics: [
      "Behavior-focused tests.",
      "Test data strategy.",
      "Bulk scenario testing.",
      "Failure and edge-case coverage.",
      "Readable assertion design."
    ],
    keyTerms: ["test strategy", "bulk test", "edge case", "assertion", "test data"],
    scenarios: [
      "A trigger works for one record but should be tested with 200.",
      "A service should behave correctly for invalid inputs too."
    ]
  }
];

DATA.lwc.push(...ADDITIONAL_LWC_TOPICS);
DATA.apex.push(...ADDITIONAL_APEX_TOPICS);

const TOPIC_DETAILS = {
  "lwc-architecture": {
    subtopics: [
      "What LWC is and why Salesforce moved from Aura-first development to standards-based components.",
      "Bundle anatomy: `.html`, `.js`, `.css`, `.js-meta.xml`, optional `.svg`, and naming rules.",
      "Targets and exposure: record page, app page, home page, utility bar, quick action, experience cloud, flow screen.",
      "Shadow DOM and component encapsulation basics.",
      "Folder-level deployment and source format inside Salesforce DX projects."
    ],
    keyTerms: ["LightningElement", "bundle", "Shadow DOM", "custom element", "target", "apiVersion"],
    scenarios: [
      "You are asked to place a reusable component on a record page and an app page.",
      "A component is not visible in App Builder because metadata exposure is incomplete.",
      "You need to explain LWC architecture in an interview using web standards language."
    ]
  },
  "lwc-reactivity": {
    subtopics: [
      "Template syntax and one-way data binding with `{property}`.",
      "Handling user input with `change`, `input`, and button click events.",
      "Reactive rerendering of primitive fields.",
      "Immutable updates for arrays and objects.",
      "Using getters for derived data and display formatting.",
      "Template restrictions and why complex expressions belong in JavaScript."
    ],
    keyTerms: ["reactivity", "getter", "immutable update", "template expression", "event target"],
    scenarios: [
      "A search input must update the screen as the user types.",
      "A list does not refresh after `push()`, so you switch to reference reassignment.",
      "You need to uppercase a value or show fallback text without writing logic inline in HTML."
    ]
  },
  "lwc-decorators": {
    subtopics: [
      "Public API with `@api` properties and methods.",
      "Reactive provisioning with `@wire` and parameter binding.",
      "Historical use of `@track` and the modern reactivity model.",
      "Lifecycle order: constructor, connectedCallback, renderedCallback, disconnectedCallback, errorCallback.",
      "Safe usage patterns inside lifecycle hooks."
    ],
    keyTerms: ["@api", "@wire", "@track", "connectedCallback", "renderedCallback", "errorCallback"],
    scenarios: [
      "A parent wants to call a child refresh method directly.",
      "A wired method should rerun when a search key changes.",
      "A resize listener must be cleaned up when the component leaves the DOM."
    ]
  },
  "lwc-communication": {
    subtopics: [
      "Parent to child communication through `@api` values.",
      "Parent calling child methods through public APIs.",
      "Child to parent communication with `CustomEvent`.",
      "Sibling communication through shared parent orchestration.",
      "Unrelated component communication with Lightning Message Service.",
      "Payload design using focused `detail` objects."
    ],
    keyTerms: ["CustomEvent", "detail", "Lightning Message Service", "publish", "subscribe", "public method"],
    scenarios: [
      "A row component sends the selected record id to its parent table.",
      "Two components on the same page but without hierarchy must stay synchronized.",
      "An interviewer asks when LMS is overkill compared to standard parent-child flow."
    ]
  },
  "lwc-data": {
    subtopics: [
      "Read-only reactive data using Apex wire methods.",
      "Imperative Apex for user-driven actions such as save, delete, and explicit refresh.",
      "Lightning Data Service and UI API for standard record operations.",
      "Caching behavior with `@AuraEnabled(cacheable=true)`.",
      "Error handling, empty state handling, and loading state handling.",
      "Refreshing stale data and deciding when custom Apex is necessary."
    ],
    keyTerms: ["wire", "imperative Apex", "LDS", "UI API", "cacheable=true", "promise"],
    scenarios: [
      "A record list should refresh automatically when filter text changes.",
      "A save button updates a record and then shows a toast.",
      "A simple record form can avoid Apex entirely by using platform data services."
    ]
  },
  "lwc-ui-patterns": {
    subtopics: [
      "Building forms with standard base components.",
      "Working with `lightning-datatable`: columns, actions, sorting, selection, inline edit.",
      "Client-side versus server-side pagination.",
      "Debouncing search inputs to reduce server chatter.",
      "Navigation, toast messages, and modal-style interaction patterns.",
      "Performance tuning for large datasets and repeated renders."
    ],
    keyTerms: ["datatable", "pagination", "inline edit", "debounce", "toast", "navigation mixin"],
    scenarios: [
      "A datatable must support large account lists without loading everything at once.",
      "A search box should wait briefly before querying.",
      "A user edits a row and expects instant feedback plus server persistence."
    ]
  },
  "lwc-security-testing": {
    subtopics: [
      "Why client-side hiding is not real security.",
      "Connecting secure LWC screens to secure Apex controllers.",
      "Loading, empty, and error state UX.",
      "High-level LWC Jest testing concepts.",
      "Release readiness checks before deploying a component."
    ],
    keyTerms: ["CRUD", "FLS", "sharing", "Jest", "error state", "empty state"],
    scenarios: [
      "A field should not be visible or editable for some users.",
      "A component must fail gracefully when the server returns an error.",
      "You need to explain how you would test a rendered button click and resulting DOM change."
    ]
  },
  "apex-core": {
    subtopics: [
      "Apex syntax basics: classes, methods, variables, conditionals, loops.",
      "Primitive types, sObjects, enums, and custom classes.",
      "Collections: list, set, map, and why they matter in Salesforce code.",
      "Execution in transaction context and the meaning of server-side logic.",
      "How Apex differs from general-purpose languages because of platform limits."
    ],
    keyTerms: ["class", "method", "transaction", "List", "Set", "Map", "sObject"],
    scenarios: [
      "A helper service calculates a value and returns it to another class.",
      "A trigger needs a map lookup instead of repeated loops.",
      "An interview question asks how Apex differs from Java."
    ]
  },
  "apex-soql-dml": {
    subtopics: [
      "SOQL basics, bind variables, and field selection discipline.",
      "Relationship queries: parent-to-child and child-to-parent.",
      "DML statements: insert, update, delete, undelete, upsert, merge.",
      "Database methods for partial success and error capture.",
      "Collection-driven query and save patterns."
    ],
    keyTerms: ["SOQL", "DML", "upsert", "merge", "Database.SaveResult", "bind variable"],
    scenarios: [
      "You need all contacts for a set of accounts in one query.",
      "A partial insert should save good records even if one record fails.",
      "An interviewer asks the difference between DML statements and Database methods."
    ]
  },
  "apex-triggers": {
    subtopics: [
      "Trigger events and the before-versus-after decision.",
      "Trigger context variables: `Trigger.new`, `Trigger.old`, maps, and booleans.",
      "Handler pattern and thin trigger structure.",
      "Recursion risks and clean orchestration.",
      "Trigger frameworks at a conceptual level."
    ],
    keyTerms: ["before insert", "after update", "Trigger.new", "handler", "recursion"],
    scenarios: [
      "Normalize a field before save on every incoming record.",
      "Create follow-up records after insert when ids are available.",
      "Refactor a giant trigger into maintainable service code."
    ]
  },
  "apex-bulk-governor": {
    subtopics: [
      "Bulkification principles for triggers, services, and batch work.",
      "Governor limits: SOQL count, DML count, CPU time, heap size, query rows.",
      "Map-and-set based data shaping.",
      "Single-query, single-DML aggregation patterns.",
      "Reasoning about scale from 1 record to 200 records and beyond."
    ],
    keyTerms: ["bulkification", "governor limits", "CPU time", "heap", "query rows", "map lookup"],
    scenarios: [
      "A trigger works for one record but fails for 200.",
      "An account update process performs DML inside a loop and hits limits.",
      "You need to redesign code to handle high-volume data safely."
    ]
  },
  "apex-async": {
    subtopics: [
      "Future methods and their limitations.",
      "Queueable Apex as the modern default for many background jobs.",
      "Batch Apex for chunked large-volume processing.",
      "Scheduled Apex for time-based execution.",
      "Async callout patterns and transaction offloading."
    ],
    keyTerms: ["@future", "Queueable", "Batchable", "Schedulable", "enqueueJob", "AllowsCallouts"],
    scenarios: [
      "A trigger needs to offload an integration callout.",
      "A nightly job must process a very large record set.",
      "You need to choose between Queueable and Batch based on volume."
    ]
  },
  "apex-lwc-security": {
    subtopics: [
      "Requirements for exposing Apex to LWC: static plus `@AuraEnabled`.",
      "Read-only controller methods with `cacheable=true`.",
      "Write methods without cacheable behavior.",
      "Sharing, CRUD, FLS, and field stripping.",
      "Designing smaller, UI-friendly return payloads."
    ],
    keyTerms: ["@AuraEnabled", "cacheable=true", "with sharing", "stripInaccessible", "UI payload"],
    scenarios: [
      "A search method is called from wire and must be cacheable.",
      "A create method is called from a save button and must perform DML.",
      "A controller should expose only fields the UI needs and only if the user can access them."
    ]
  },
  "apex-testing-integration": {
    subtopics: [
      "Why tests validate behavior, not just code coverage.",
      "Creating test data and keeping tests isolated.",
      "Using `Test.startTest()` and `Test.stopTest()`.",
      "Testing async jobs and controller methods.",
      "Callouts, mocks, and Named Credentials at a conceptual level."
    ],
    keyTerms: ["@isTest", "assert", "startTest", "stopTest", "mock", "Named Credential"],
    scenarios: [
      "A controller method creates an account and your test must verify the saved value.",
      "A queueable job should execute during a test context.",
      "A callout integration must be described safely in design and deployment review."
    ]
  }
};

const CURRICULUM_AUDIT = {
  lwc: [
    "Architecture and bundle structure",
    "Templates and data binding",
    "Reactivity and getters",
    "Decorators and lifecycle hooks",
    "Conditional rendering and loops",
    "Component communication",
    "Wire, imperative Apex, LDS, and UI API",
    "Datatable, forms, navigation, and toasts",
    "Component composition and slots",
    "Validation and save flows",
    "Static resources and third-party libraries",
    "Lightning Message Service in depth",
    "Jest testing patterns",
    "Quick actions and workflow context",
    "Performance patterns",
    "Security thinking and testing mindset"
  ],
  apex: [
    "Language fundamentals and execution model",
    "Collections and data structures",
    "SOQL and relationship queries",
    "DML and Database methods",
    "Triggers and handler pattern",
    "Order of execution",
    "Bulkification and governor limits",
    "Exception handling",
    "Async Apex patterns",
    "Apex exposed to LWC",
    "Security enforcement",
    "Sharing modes and execution context",
    "REST callouts and Named Credentials",
    "Platform events and event-driven architecture",
    "Apex REST services",
    "Testing and integration readiness"
  ]
};

[...DATA.lwc, ...DATA.apex].forEach((topic) => {
  const details = TOPIC_DETAILS[topic.id];
  topic.subtopics = details?.subtopics || topic.subtopics || [];
  topic.keyTerms = details?.keyTerms || topic.keyTerms || [];
  topic.scenarios = details?.scenarios || topic.scenarios || [];
});

const state = {
  currentTab: "lwc",
  currentTopicId: DATA.lwc[0].id,
  done: JSON.parse(localStorage.getItem("mastery_done") || "{}"),
  practiceNotes: JSON.parse(localStorage.getItem("mastery_practice_notes") || "{}")
};

const content = document.getElementById("content");
const tabs = document.querySelectorAll(".tab");
const searchBox = document.getElementById("searchBox");
const sidebarHeading = document.getElementById("sidebarHeading");
const topicCount = document.getElementById("topicCount");
const topicList = document.getElementById("topicList");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
  localStorage.setItem("learner_dev_theme", theme);
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

function getTopicPool() {
  if (state.currentTab === "lwc") {
    return DATA.lwc;
  }
  if (state.currentTab === "apex") {
    return DATA.apex;
  }
  if (state.currentTab === "practice") {
    return [...DATA.lwc, ...DATA.apex];
  }
  return [];
}

function getCurrentTopic() {
  return [...DATA.lwc, ...DATA.apex].find((topic) => topic.id === state.currentTopicId);
}

function setTab(tabName) {
  state.currentTab = tabName;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  searchBox.value = "";

  if (tabName === "lwc") {
    state.currentTopicId = DATA.lwc[0].id;
  } else if (tabName === "apex") {
    state.currentTopicId = DATA.apex[0].id;
  } else if (tabName === "practice") {
    state.currentTopicId = [...DATA.lwc, ...DATA.apex][0].id;
  }

  renderSidebar();
  renderMain();
}

function renderSidebar() {
  const pool = getTopicPool();
  const query = searchBox.value.trim().toLowerCase();

  if (state.currentTab === "final") {
    sidebarHeading.textContent = "Final Test";
    topicCount.textContent = "Ready";
    topicList.innerHTML = `
      <div class="topic-btn active">
        <strong>Combined LWC + Apex Assessment</strong>
        <span>MCQ review plus written coding prompts</span>
      </div>
    `;
    progressText.textContent = `${getCompletionPercent()}%`;
    progressBar.style.width = `${getCompletionPercent()}%`;
    return;
  }

  const filtered = pool.filter((topic) => {
    const haystack = [
      topic.title,
      topic.level,
      topic.focus,
      topic.objectives.join(" "),
      topic.subtopics.join(" "),
      topic.keyTerms.join(" ")
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  sidebarHeading.textContent =
    state.currentTab === "practice"
      ? "Written Practice"
      : state.currentTab === "lwc"
        ? "LWC Curriculum"
        : "Apex Curriculum";
  topicCount.textContent = filtered.length;
  topicList.innerHTML = filtered.map((topic) => `
    <button class="topic-btn ${topic.id === state.currentTopicId ? "active" : ""}" data-id="${topic.id}">
      ${state.done[topic.id] ? '<span class="done-dot">Done</span>' : ""}
      <strong>${topic.title}</strong>
      <span>${topic.level} · ${topic.subtopics.length} subtopics</span>
    </button>
  `).join("");

  document.querySelectorAll(".topic-btn[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentTopicId = button.dataset.id;
      renderSidebar();
      renderMain();
    });
  });

  const percent = getCompletionPercent();
  progressText.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function getCompletionPercent() {
  const allTopics = [...DATA.lwc, ...DATA.apex];
  const completed = allTopics.filter((topic) => state.done[topic.id]).length;
  return Math.round((completed / allTopics.length) * 100);
}

function renderMain() {
  if (state.currentTab === "practice") {
    renderPracticeLab();
    return;
  }
  if (state.currentTab === "final") {
    renderFinalTest();
    return;
  }
  renderLessonView();
}

function renderLessonView() {
  const topic = getCurrentTopic();
  if (!topic) {
    return;
  }

  content.innerHTML = `
    <section class="hero-card animate-in">
      <div class="hero-copy">
        <p class="eyebrow">Detailed Learning Path</p>
        <h2>${topic.title}</h2>
        <p>${topic.focus}</p>
        <div class="practice-meta">
          <span class="tag">${state.currentTab.toUpperCase()}</span>
          <span class="tag">${topic.level}</span>
          <span class="tag">${topic.quiz.length} quick checks</span>
          <span class="tag">${topic.subtopics.length} subtopics</span>
          <span class="tag">Written coding task included</span>
        </div>
        <div class="button-row">
          <button id="markDone" class="primary-btn">${state.done[topic.id] ? "Completed" : "Mark Topic Done"}</button>
          <button id="jumpPractice" class="secondary-btn">Open Written Practice</button>
        </div>
      </div>
      <div class="hero-actions">
        <div class="hero-metrics">
          <div class="metric-card">
            <strong>${topic.objectives.length}</strong>
            <span>Learning targets</span>
          </div>
          <div class="metric-card">
            <strong>${topic.subtopics.length}</strong>
            <span>Subtopics covered</span>
          </div>
          <div class="metric-card">
            <strong>${topic.pitfalls.length}</strong>
            <span>Common mistakes</span>
          </div>
          <div class="metric-card">
            <strong>${getCompletionPercent()}%</strong>
            <span>Overall completion</span>
          </div>
        </div>
      </div>
    </section>

    <section class="content-grid animate-in">
      <article class="panel main-panel">
        <div class="section-label">Concept Breakdown</div>
        <div class="rich-text">${topic.deepDive.map((item) => `<p>${item}</p>`).join("")}</div>
        <div class="section-label">What You Should Be Able To Do</div>
        <ul class="list-block">${topic.objectives.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="section-label">Subtopics To Master</div>
        <ul class="list-block">${topic.subtopics.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>

      <article class="panel">
        <div class="section-label">Code Example</div>
        <pre><code id="lessonCode">${escapeHtml(topic.example)}</code></pre>
        <button id="copyCode" class="secondary-btn">Copy Example</button>
      </article>

      <article class="panel">
        <div class="section-label">Interview Answer</div>
        <p class="rich-text">${topic.interview}</p>
      </article>

      <article class="panel">
        <div class="section-label">Key Terms</div>
        <div class="practice-meta">${topic.keyTerms.map((item) => `<span class="tag">${item}</span>`).join("")}</div>
      </article>

      <article class="panel">
        <div class="section-label">Common Mistakes</div>
        <ul class="list-block">${topic.pitfalls.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>

      <article class="panel">
        <div class="section-label">Real Project Scenarios</div>
        <ul class="list-block">${topic.scenarios.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>

      <article class="panel">
        <div class="section-label">Quick Revision Quiz</div>
        <div id="miniQuiz"></div>
      </article>
    </section>

    <section class="content-grid animate-in">
      <article class="panel">
        <div class="section-label">Coverage Check</div>
        <p class="rich-text">This lesson is one part of the full ${state.currentTab.toUpperCase()} track. Use this checklist to verify the site is covering the major areas, not just isolated examples.</p>
        <ul class="list-block">${CURRICULUM_AUDIT[state.currentTab].map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
      <article class="panel">
        <div class="section-label">How To Study This Topic</div>
        <ul class="list-block">
          <li>Read the concept breakdown and make sure you can explain each subtopic without looking.</li>
          <li>Copy or rewrite the example until you understand why each line exists.</li>
          <li>Complete the written practice task for active recall.</li>
          <li>Use the quick quiz only after you feel comfortable with the subtopic list.</li>
        </ul>
      </article>
    </section>
  `;

  document.getElementById("markDone").addEventListener("click", () => {
    state.done[topic.id] = true;
    localStorage.setItem("mastery_done", JSON.stringify(state.done));
    renderSidebar();
    renderLessonView();
  });

  document.getElementById("jumpPractice").addEventListener("click", () => {
    state.currentTab = "practice";
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "practice"));
    renderSidebar();
    renderPracticeLab();
  });

  document.getElementById("copyCode").addEventListener("click", async () => {
    await navigator.clipboard.writeText(topic.example);
    const button = document.getElementById("copyCode");
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = "Copy Example";
    }, 1200);
  });

  renderMiniQuiz(topic);
}

function renderMiniQuiz(topic) {
  const miniQuiz = document.getElementById("miniQuiz");
  miniQuiz.innerHTML = topic.quiz.map((question, questionIndex) => `
    <div class="quiz-card">
      <p><strong>${questionIndex + 1}. ${question.q}</strong></p>
      ${question.options.map((option, optionIndex) => `
        <button class="option" data-question="${questionIndex}" data-option="${optionIndex}">${option}</button>
      `).join("")}
      <div class="feedback" id="feedback-${questionIndex}"></div>
    </div>
  `).join("");

  miniQuiz.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => {
      const questionIndex = Number(button.dataset.question);
      const optionIndex = Number(button.dataset.option);
      const question = topic.quiz[questionIndex];
      const quizCard = button.closest(".quiz-card");
      const options = quizCard.querySelectorAll(".option");

      options.forEach((option) => {
        option.disabled = true;
      });

      if (optionIndex === question.answer) {
        button.classList.add("correct");
        quizCard.querySelector(".feedback").textContent = "Correct";
      } else {
        button.classList.add("wrong");
        options[question.answer].classList.add("correct");
        quizCard.querySelector(".feedback").textContent = "Needs one more review pass";
      }
    });
  });
}

function renderPracticeLab() {
  const topic = getCurrentTopic();
  if (!topic) {
    return;
  }

  const saved = state.practiceNotes[topic.id] || "";

  content.innerHTML = `
    <section class="practice-hero animate-in">
      <div>
        <p class="eyebrow">Written Coding Practice</p>
        <h2>${topic.exercise.title}</h2>
        <p>${topic.exercise.prompt}</p>
        <div class="practice-meta">
          <span class="tag">${topic.title}</span>
          <span class="tag">${state.done[topic.id] ? "Topic completed" : "Topic still in progress"}</span>
          <span class="tag">Autosaved locally when you click save</span>
        </div>
      </div>
      <div class="summary-card">
        <h3>How to use this lab</h3>
        <p class="muted">Write a small answer in your own words or code. The goal here is active recall, not passive reading.</p>
        <ul class="list-block">${topic.exercise.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
    </section>

    <section class="practice-grid animate-in">
      <article class="panel">
        <div class="section-label">Starter Code</div>
        <pre><code>${escapeHtml(topic.exercise.starter)}</code></pre>
      </article>

      <article class="panel">
        <div class="section-label">Your Answer</div>
        <textarea id="practiceEditor" class="editor" placeholder="Write your LWC or Apex answer here...">${escapeHtml(saved)}</textarea>
        <div class="button-row">
          <button id="savePractice" class="save-btn">Save Answer</button>
          <button id="markPracticeDone" class="primary-btn">Mark Topic Done</button>
        </div>
        <div id="saveStatus" class="status-text"></div>
      </article>

      <article class="panel">
        <div class="section-label">What a Strong Answer Should Include</div>
        <div class="rubric-box">
          <ul class="list-block">${topic.exercise.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
      </article>

      <article class="panel">
        <div class="section-label">Review Prompt</div>
        <div class="hint-box">
          <p class="rich-text">After writing your answer, compare it against the checklist. If you can explain why each checklist item matters, you are learning at interview level, not just memorizing syntax.</p>
        </div>
      </article>
    </section>
  `;

  document.getElementById("savePractice").addEventListener("click", () => {
    const value = document.getElementById("practiceEditor").value;
    state.practiceNotes[topic.id] = value;
    localStorage.setItem("mastery_practice_notes", JSON.stringify(state.practiceNotes));
    document.getElementById("saveStatus").textContent = "Answer saved locally in this browser.";
  });

  document.getElementById("markPracticeDone").addEventListener("click", () => {
    state.done[topic.id] = true;
    localStorage.setItem("mastery_done", JSON.stringify(state.done));
    renderSidebar();
    document.getElementById("saveStatus").textContent = "Topic marked complete.";
  });
}

function renderFinalTest() {
  content.innerHTML = `
    <section class="final-hero animate-in">
      <div>
        <p class="eyebrow">Combined Assessment</p>
        <h2>LWC + Apex Final Test</h2>
        <p>This section mixes objective questions with written coding prompts so you can test recall, reasoning, and implementation together.</p>
        <div class="practice-meta">
          <span class="tag">${DATA.finalTest.multipleChoice.length} MCQs</span>
          <span class="tag">${DATA.finalTest.codingPrompts.length} coding prompts</span>
          <span class="tag">${getCompletionPercent()}% curriculum completed</span>
        </div>
      </div>
      <div class="summary-card">
        <h3>What this final test checks</h3>
        <ul class="list-block">
          <li>LWC architecture, data flow, and communication</li>
          <li>Apex trigger design, bulkification, security, and tests</li>
          <li>Your ability to write short code from memory</li>
        </ul>
      </div>
    </section>

    <section class="test-grid animate-in">
      <article class="panel">
        <div class="section-label">Multiple Choice Review</div>
        <div id="finalMcq"></div>
        <button id="submitFinalMcq" class="primary-btn">Submit MCQ Test</button>
        <div id="finalResult" class="result-box hidden"></div>
      </article>

      <article class="panel">
        <div class="section-label">Written Coding Prompts</div>
        <div id="finalCodingPrompts"></div>
      </article>
    </section>
  `;

  renderFinalMcq();
  renderFinalCodingPrompts();
}

function renderFinalMcq() {
  const finalMcq = document.getElementById("finalMcq");
  finalMcq.innerHTML = DATA.finalTest.multipleChoice.map((question, index) => `
    <div class="test-question">
      <p><strong>${index + 1}. ${question.q}</strong></p>
      <p class="test-subtle">${question.topic}</p>
      ${question.options.map((option, optionIndex) => `
        <label class="option">
          <input type="radio" name="final-q-${index}" value="${optionIndex}" />
          ${option}
        </label>
      `).join("")}
    </div>
  `).join("");

  document.getElementById("submitFinalMcq").addEventListener("click", () => {
    let score = 0;
    DATA.finalTest.multipleChoice.forEach((question, index) => {
      const checked = document.querySelector(`input[name="final-q-${index}"]:checked`);
      if (checked && Number(checked.value) === question.answer) {
        score += 1;
      }
    });

    const percent = Math.round((score / DATA.finalTest.multipleChoice.length) * 100);
    const result = document.getElementById("finalResult");
    result.classList.remove("hidden");
    result.innerHTML = `
      <strong>Score: ${score}/${DATA.finalTest.multipleChoice.length} (${percent}%)</strong>
      <p>${percent >= 80 ? "Strong result. Spend time on the written prompts next." : "Review the lesson tabs once more, then retake this MCQ round."}</p>
    `;
  });
}

function renderFinalCodingPrompts() {
  const savedPrompts = state.practiceNotes;
  const container = document.getElementById("finalCodingPrompts");
  container.innerHTML = DATA.finalTest.codingPrompts.map((prompt, index) => `
    <div class="practice-card">
      <h3>${index + 1}. ${prompt.title}</h3>
      <p class="muted">${prompt.prompt}</p>
      <textarea class="editor final-editor" data-id="${prompt.id}" placeholder="Write your answer here...">${escapeHtml(savedPrompts[prompt.id] || "")}</textarea>
      <button class="save-btn final-save" data-id="${prompt.id}">Save Prompt Answer</button>
    </div>
  `).join("");

  document.querySelectorAll(".final-save").forEach((button) => {
    button.addEventListener("click", () => {
      const promptId = button.dataset.id;
      const editor = document.querySelector(`.final-editor[data-id="${promptId}"]`);
      state.practiceNotes[promptId] = editor.value;
      localStorage.setItem("mastery_practice_notes", JSON.stringify(state.practiceNotes));
      button.textContent = "Saved";
      window.setTimeout(() => {
        button.textContent = "Save Prompt Answer";
      }, 1200);
    });
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setTab(tab.dataset.tab);
  });
});

searchBox.addEventListener("input", renderSidebar);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
  applyTheme(nextTheme);
});

applyTheme(localStorage.getItem("learner_dev_theme") || "light");

renderSidebar();
renderMain();
