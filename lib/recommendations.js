export const PROMPT_LIBRARY = {
  beginner: [
    "Explain this topic like I am moving from admin to developer, then give me one safe practice task.",
    "Show me the minimum correct LWC structure before adding advanced patterns.",
    "Give me one Apex example and one likely interview follow-up question."
  ],
  "admin-to-dev": [
    "Map this topic to what an admin already knows from flows, page layouts, and validation rules.",
    "Show me how this concept appears in a real org requirement, not just an interview answer.",
    "Give me one conversion exercise from declarative logic to code."
  ],
  interview: [
    "Ask me a tough interview version of this topic and then grade my answer.",
    "Give me common mistakes an interviewer expects me to avoid.",
    "Turn this concept into a 90-second spoken answer."
  ],
  "project-builder": [
    "Turn this concept into a mini feature with component, server logic, and testing notes.",
    "Give me a clean file structure before I start coding.",
    "Explain the performance and security choices for this implementation."
  ]
};

export const MEDIA_LIBRARY = {
  lwc: [
    {
      type: "Video",
      title: "Lightning Web Components Basics",
      description: "Official Salesforce developer learning material for LWC foundations and component thinking.",
      href: "https://developer.salesforce.com/developer-centers/lightning-web-components",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
    },
    {
      type: "Podcast",
      title: "The Salesforce Developers Podcast",
      description: "Useful for ecosystem context, platform patterns, and career-oriented conversations.",
      href: "https://developer.salesforce.com/podcast",
      image:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80"
    },
    {
      type: "Video",
      title: "Trailhead Live and Developer Videos",
      description: "Browse official recordings that pair well with the current topic and practice flow.",
      href: "https://developer.salesforce.com/video",
      image:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"
    }
  ],
  apex: [
    {
      type: "Video",
      title: "Apex Developer Center",
      description: "Official Apex hub covering classes, testing, limits, and architecture guidance.",
      href: "https://developer.salesforce.com/developer-centers/apex",
      image:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80"
    },
    {
      type: "Podcast",
      title: "The Salesforce Developers Podcast",
      description: "Good for hearing how experienced developers think about maintainable server-side design.",
      href: "https://developer.salesforce.com/podcast",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
    },
    {
      type: "Video",
      title: "Salesforce Developers Video Library",
      description: "A useful place to find talks on Apex patterns, testing, and governor-limit strategy.",
      href: "https://developer.salesforce.com/video",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80"
    }
  ]
};
