const messenger  = require('../services/messengerService');
const logger     = require('../utils/logger');
const { askGroq } = require('../services/groqService');

// ─────────────────────────────────────────────────────────────────────────────
// QUALISEARCH KNOWLEDGE BASE
// All official responses sourced from QualiSearch Global (qualisearchglobal.com)
// ─────────────────────────────────────────────────────────────────────────────

// ── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Return a random item from an array, so responses feel varied and less scripted.
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Simulate a human-like typing pause before sending a reply.
 * Short messages → short pause; longer content → slightly longer pause.
 * @param {number} ms - milliseconds to wait (default: 900 ms)
 */
const pause = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Return a time-aware greeting phrase based on the current local hour.
 */
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Hello';
};

/**
 * Fetch the user's first name from the Messenger Profile API.
 * Falls back to null if unavailable (e.g., privacy settings).
 */
const getFirstName = async (senderId) => {
  try {
    const profile = await messenger.getUserProfile(senderId);
    return profile?.first_name || null;
  } catch {
    return null;
  }
};

/**
 * Build a warm, personalised salutation.
 * @param {string|null} firstName
 */
const salutation = (firstName) =>
  firstName ? `, ${firstName}` : '';

// ── Follow-up prompts (randomly picked to avoid repetition) ──────────────────
const FOLLOW_UP_PROMPTS = [
  'Is there anything else I can help you with? 😊',
  'Feel free to ask if you have more questions!',
  'Let me know if there\'s anything else on your mind. 🙂',
  'Happy to help with anything else — just say the word!',
  'Is there something else I can assist you with today?',
];

/**
 * Send the main menu with a human-sounding follow-up prompt.
 */
const sendMainMenu = async (senderId, customPrompt = null) => {
  const prompt = customPrompt || pick(FOLLOW_UP_PROMPTS);
  await messenger.sendQuickReplies(
    senderId,
    prompt,
    [
      { content_type: 'text', title: '📝 Article Submission',   payload: 'ARTICLE_SUBMISSION'   },
      { content_type: 'text', title: '🔄 Publication Process',  payload: 'PUBLICATION_PROCESS'  },
      { content_type: 'text', title: '💳 Publication Fee',      payload: 'PUBLICATION_FEE'      },
      { content_type: 'text', title: '📊 Manuscript Status',    payload: 'MANUSCRIPT_STATUS'    },
      { content_type: 'text', title: '📋 Journal Guidelines',   payload: 'JOURNAL_GUIDELINES'   },
      { content_type: 'text', title: '🏛️ Programs & Services', payload: 'PROGRAMS_SERVICES'    },
      { content_type: 'text', title: '📞 Contact Support',      payload: 'CONTACT_SUPPORT'      },
    ]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a received text message from a user.
 * Matches user input to QualiSearch FAQ intents.
 */
const handleTextMessage = async (senderId, messageText) => {
  const text = messageText.toLowerCase().trim();

  logger.info('Handling text message', { senderId, text });

  // Show typing indicator while we "think"
  await messenger.sendTypingOn(senderId);
  await pause(700);

  // ── Greetings / Welcome ───────────────────────────────────────────────────
  if (
    ['hi', 'hello', 'hey', 'start', 'get started', 'good morning',
     'good afternoon', 'good evening', 'howdy', 'greetings'].some((w) => text.includes(w))
  ) {
    await handleWelcome(senderId);
    return;
  }

  // ── Gratitude ─────────────────────────────────────────────────────────────
  if (
    text.includes('thank') ||
    text.includes('thanks') ||
    text.includes('salamat') ||
    text.includes('appreciate')
  ) {
    await handleThanks(senderId);
    return;
  }

  // ── Article / Manuscript Submission ──────────────────────────────────────
  if (
    text.includes('submit') ||
    text.includes('submission') ||
    text.includes('how to submit') ||
    text.includes('manuscript') ||
    text.includes('article')
  ) {
    await sendArticleSubmission(senderId);
    return;
  }

  // ── Account ───────────────────────────────────────────────────────────────
  if (
    text.includes('account') ||
    text.includes('register') ||
    text.includes('sign up') ||
    text.includes('create account') ||
    text.includes('login') ||
    text.includes('log in')
  ) {
    await sendAccountInfo(senderId);
    return;
  }

  // ── Publication Process ───────────────────────────────────────────────────
  if (
    text.includes('process') ||
    text.includes('publication process') ||
    text.includes('peer review') ||
    text.includes('editorial') ||
    text.includes('how long') ||
    text.includes('timeline')
  ) {
    await sendPublicationProcess(senderId);
    return;
  }

  // ── Publication Fee ───────────────────────────────────────────────────────
  if (
    text.includes('fee') ||
    text.includes('payment') ||
    text.includes('pay') ||
    text.includes('cost') ||
    text.includes('price') ||
    text.includes('₱') ||
    text.includes('php') ||
    text.includes('how much')
  ) {
    await sendPublicationFee(senderId);
    return;
  }

  // ── When to Pay ───────────────────────────────────────────────────────────
  if (text.includes('when') && (text.includes('pay') || text.includes('payment'))) {
    await sendWhenToPay(senderId);
    return;
  }

  // ── Manuscript Status ─────────────────────────────────────────────────────
  if (
    text.includes('status') ||
    text.includes('check') ||
    text.includes('track') ||
    text.includes('update') ||
    text.includes('where is my')
  ) {
    await sendManuscriptStatus(senderId);
    return;
  }

  // ── Journal / Guidelines ──────────────────────────────────────────────────
  if (
    text.includes('journal') ||
    text.includes('guideline') ||
    text.includes('format') ||
    text.includes('template') ||
    text.includes('requirement') ||
    text.includes('standard')
  ) {
    await sendJournalGuidelines(senderId);
    return;
  }

  // ── Programs & Services ───────────────────────────────────────────────────
  if (
    text.includes('program') ||
    text.includes('service') ||
    text.includes('pillar') ||
    text.includes('innovation') ||
    text.includes('academic press') ||
    text.includes('qualisearch')
  ) {
    await sendProgramsServices(senderId);
    return;
  }

  // ── Contact / Support ─────────────────────────────────────────────────────
  if (
    text.includes('contact') ||
    text.includes('support') ||
    text.includes('help') ||
    text.includes('human') ||
    text.includes('agent') ||
    text.includes('representative') ||
    text.includes('email') ||
    text.includes('call')
  ) {
    await sendContactSupport(senderId);
    return;
  }

  // ── Website ───────────────────────────────────────────────────────────────
  if (
    text.includes('website') ||
    text.includes('site') ||
    text.includes('link') ||
    text.includes('url') ||
    text.includes('where')
  ) {
    await sendWebsiteInfo(senderId);
    return;
  }

  // ── Menu / Options ────────────────────────────────────────────────────────
  if (
    text.includes('menu') ||
    text.includes('option') ||
    text.includes('back') ||
    text.includes('more')
  ) {
    await sendMainMenu(senderId, 'Here\'s what I can help you with — just pick one! 👇');
    return;
  }

  // ── Default Fallback ──────────────────────────────────────────────────────
  await handleFallback(senderId, messageText);
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL HANDLERS (welcome, thanks, fallback)
// ─────────────────────────────────────────────────────────────────────────────

const handleWelcome = async (senderId) => {
  const firstName  = await getFirstName(senderId);
  const timeGreet  = getTimeGreeting();
  const name       = salutation(firstName);

  const openers = [
    `${timeGreet}${name}! 👋 Great to hear from you!`,
    `Hey${name}! 😊 ${timeGreet}! So glad you reached out.`,
    `${timeGreet}${name}! Welcome to QualiSearch — I'm happy you're here!`,
    `Hi${name}! ${timeGreet} and welcome! 🌟`,
  ];

  await messenger.sendTextMessage(senderId, pick(openers));
  await pause(800);
  await messenger.sendTypingOn(senderId);
  await pause(1000);
  await messenger.sendTextMessage(
    senderId,
    'We\'re QualiSearch — an interdisciplinary research and knowledge institution dedicated to ethical scholarship, credible academic publishing, professional development, and meaningful social impact.\n\nWhat can I help you with today?'
  );
  await sendMainMenu(senderId, 'Here are some things I can assist you with 👇');
};

const handleThanks = async (senderId) => {
  const firstName = await getFirstName(senderId);
  const name      = salutation(firstName);

  const replies = [
    `You're so welcome${name}! 😊 It's always a pleasure helping you.`,
    `Anytime${name}! Don't hesitate to reach out if you need anything else. 🙌`,
    `Happy to help${name}! That's what I'm here for. 😄`,
    `Of course${name}! Feel free to come back anytime you have questions. ✨`,
  ];

  await messenger.sendTextMessage(senderId, pick(replies));
  await pause(600);
  await sendMainMenu(senderId);
};

const handleFallback = async (senderId, originalText) => {
  logger.info('Fallback triggered — trying Groq AI', { senderId, originalText });

  // ── Try Groq AI first ────────────────────────────────────────────────────
  // Only kicks in when keyword matching finds nothing.
  // If Groq_API env var is missing or the call fails, gracefully falls through.
  await messenger.sendTypingOn(senderId);
  await pause(1000);

  const aiReply = await askGroq(originalText);

  if (aiReply) {
    await messenger.sendTextMessage(senderId, aiReply);
    await pause(700);
    await sendMainMenu(senderId);
    return;
  }

  // ── Groq unavailable — friendly fallback ─────────────────────────────────
  const empathyLines = [
    'Hmm, I want to make sure I give you the right answer — let me point you to the right option! 😊',
    'That\'s a great one! Let me show you the options that might help. 👇',
    'I hear you! Let me show you what I can help you with. 👇',
    'I want to make sure I help you correctly! Here are the topics I can assist with. 🙂',
  ];

  await messenger.sendTextMessage(senderId, pick(empathyLines));
  await pause(700);
  await messenger.sendTypingOn(senderId);
  await pause(800);
  await sendMainMenu(senderId, 'Which of these are you looking for?');
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE FUNCTIONS — Each maps to one FAQ topic
// ─────────────────────────────────────────────────────────────────────────────

const sendArticleSubmission = async (senderId) => {
  const intros = [
    'Sure! Here\'s how you can submit your manuscript step by step 📝',
    'Great! Submitting is pretty straightforward — let me walk you through it! 📝',
    'Absolutely! Here\'s everything you need to know about submitting your manuscript. 📝',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1200);
  await messenger.sendTextMessage(
    senderId,
    '1️⃣ Head over to https://qualisearchglobal.com/\n' +
    '2️⃣ Click on Academic Press from the QualiSearch Pillars of Innovation\n' +
    '3️⃣ Choose the journal that fits your manuscript\n' +
    '4️⃣ Create your author account on the submission platform\n' +
    '5️⃣ Log in and fill in the required manuscript details\n' +
    '6️⃣ Upload your manuscript and all supporting documents\n' +
    '7️⃣ Double-check everything, then hit Submit! ✅\n\n' +
    'You\'ll receive a confirmation once your submission goes through. Good luck! 🍀'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendAccountInfo = async (senderId) => {
  const intros = [
    'Yes, you\'ll need an account — but don\'t worry, it\'s quick to set up! 👤',
    'Good question! Here\'s what you need to know about creating an account. 👤',
    'You\'ll need to register first — here\'s why it matters and how to do it. 👤',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1100);
  await messenger.sendTextMessage(
    senderId,
    'Having an account lets you:\n' +
    '• Submit your manuscript 📄\n' +
    '• Get notified by the editorial team 📬\n' +
    '• Upload revisions when needed ✏️\n' +
    '• Track the progress of your submission 🔍\n\n' +
    'To get started, visit https://qualisearchglobal.com/, select Academic Press, choose your journal, and look for the registration or submission portal. Easy! 😊'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendPublicationProcess = async (senderId) => {
  const intros = [
    'Great question! Here\'s a breakdown of the full publication journey from start to finish. 🔄',
    'Sure! The process has several stages, but I\'ll make it easy to follow. 🔄',
    'Happy to explain! Here\'s the entire publication process laid out for you. 🔄',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1300);
  await messenger.sendTextMessage(
    senderId,
    'Here\'s the typical publication journey at QualiSearch:\n\n' +
    '1️⃣ Account Registration\n' +
    '2️⃣ Manuscript Submission\n' +
    '3️⃣ Initial Editorial Screening\n' +
    '4️⃣ Peer Review\n' +
    '5️⃣ Author Revision\n' +
    '6️⃣ Final Evaluation\n' +
    '7️⃣ Acceptance\n' +
    '8️⃣ Payment\n' +
    '9️⃣ Copyediting\n' +
    '🔟 Layout Preparation\n' +
    '1️⃣1️⃣ Author Proofreading\n' +
    '1️⃣2️⃣ Online Publication 🎉\n\n' +
    'Each step ensures the quality and integrity of what gets published. It\'s thorough, but worth it!'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendPublicationFee = async (senderId) => {
  const intros = [
    'Of course! Here\'s what you need to know about publication fees. 💳',
    'Sure thing! Let me break down the publication fee for you. 💳',
    'Great question! Here are the details on publication costs. 💳',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1100);
  await messenger.sendTextMessage(
    senderId,
    'The regular article publication fee for the QualiSearch Journal of Educational Research and Practice is:\n\n' +
    '💰 ₱5,000\n\n' +
    'Special issue rates may differ depending on the call for papers or partnership arrangement — the team will let you know the applicable amount before publication.\n\n' +
    '⚠️ One important thing to remember: payment is only made after your manuscript has been formally accepted. Paying early doesn\'t guarantee acceptance, so please wait for the editorial team\'s confirmation! 🙏'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendWhenToPay = async (senderId) => {
  const intros = [
    'Great that you asked — this is really important to know! ⏰',
    'Timing matters here! Let me clarify when payment should happen. ⏰',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(800);
  await messenger.sendTypingOn(senderId);
  await pause(1000);
  await messenger.sendTextMessage(
    senderId,
    'You should only pay after your manuscript has:\n\n' +
    '✅ Completed the full evaluation process\n' +
    '✅ Been formally accepted for publication\n\n' +
    'The editorial team will personally reach out to notify you when it\'s time. Please don\'t pay before then — payment doesn\'t guarantee acceptance. 🙏\n\n' +
    'If you\'re unsure about your manuscript\'s status, feel free to contact the team!'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendManuscriptStatus = async (senderId) => {
  const intros = [
    'Of course! Here\'s how you can check on your submission. 📊',
    'Sure! There are a couple of ways to track your manuscript. 📊',
    'No problem! Let me show you how to check your manuscript\'s status. 📊',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  
  await messenger.sendTypingOn(senderId);
  await pause(1500);
  await messenger.sendTextMessage(senderId, 'You can check status on website also!');

  await pause(1000);
  await messenger.sendTypingOn(senderId);
  await pause(2000);
  await messenger.sendTextMessage(
    senderId,
    'You have two options:\n\n' +
    '1️⃣ Online — Log in to your QualiSearch Academic Press author account at https://qualisearchglobal.com/ to view your submission status anytime.\n\n' +
    '2️⃣ Contact the Editorial Team — Reach out directly and provide:\n' +
    '   📌 Your manuscript title\n' +
    '   📌 Your full name (corresponding author)\n' +
    '   📌 Journal name\n' +
    '   📌 Date of submission\n\n' +
    'A representative will get back to you as soon as they can! 😊'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendJournalGuidelines = async (senderId) => {
  const intros = [
    'Happy to help with that! Here\'s where to find the official journal guidelines. 📋',
    'Sure! Every journal has its own guidelines — here\'s how to find them. 📋',
    'Great question! Let me point you in the right direction. 📋',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1100);
  await messenger.sendTextMessage(
    senderId,
    'The most up-to-date guidelines, formatting requirements, and calls for papers are all available on the official website:\n\n' +
    '🌐 https://qualisearchglobal.com/\n\n' +
    'Here\'s how to navigate there:\n' +
    '1️⃣ Select Academic Press from the Pillars of Innovation\n' +
    '2️⃣ Choose your preferred journal\n' +
    '3️⃣ Review the submission guidelines for that specific journal\n\n' +
    'If anything is unclear or not covered on the website, a QualiSearch representative will be happy to assist you directly! 🙂'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendProgramsServices = async (senderId) => {
  const intros = [
    'QualiSearch offers quite a few programs! Let me give you a quick overview. 🏛️',
    'Great question! Here\'s what QualiSearch is all about. 🏛️',
    'Absolutely! QualiSearch does so much — here\'s a summary. 🏛️',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1100);
  await messenger.sendTextMessage(
    senderId,
    'QualiSearch is an interdisciplinary research and knowledge institution offering:\n\n' +
    '📚 Academic Press — Credible and rigorous journal publications\n' +
    '🎓 Professional Development — Practical training and workshops\n' +
    '🔬 Research Services — Ethical and high-quality scholarly research\n' +
    '🌍 Social Impact Programs — Meaningful community and societal engagement\n\n' +
    'For full details on all programs, partnerships, and upcoming calls for papers:\n' +
    '🌐 https://qualisearchglobal.com/\n\n' +
    'There\'s a lot happening — definitely worth checking out! 😊'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendContactSupport = async (senderId) => {
  const intros = [
    'Of course! I\'ll connect you with the right details to reach the team. 📞',
    'Sure! Here\'s how you can get in touch with a QualiSearch representative. 📞',
    'No problem! Let me give you the contact information you need. 📞',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(900);
  await messenger.sendTypingOn(senderId);
  await pause(1100);
  await messenger.sendTextMessage(
    senderId,
    'Here are the official contact details for QualiSearch Academic Press:\n\n' +
    '📧 Email: qualisearchconsulting@gmail.com\n' +
    '📱 Mobile: +639173039530\n' +
    '🌐 Website: https://qualisearchglobal.com/\n' +
    '📍 Address: B12 L55 Oregano Street, Tagaytay Heights Subdivision, Tagaytay City, Cavite 4120, Philippines\n\n' +
    'When reaching out, it helps to include:\n' +
    '• Your full name\n' +
    '• Manuscript title (if applicable)\n' +
    '• Journal name\n' +
    '• A brief description of your concern\n\n' +
    'That way, the team can assist you much faster! 😊 They strive to respond within a reasonable timeframe.'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

const sendWebsiteInfo = async (senderId) => {
  const intros = [
    'Of course! Here\'s the link to the official QualiSearch website. 🌐',
    'Sure! You can find everything you need at the QualiSearch website. 🌐',
  ];

  await messenger.sendTextMessage(senderId, pick(intros));
  await pause(800);
  await messenger.sendTypingOn(senderId);
  await pause(900);
  await messenger.sendTextMessage(
    senderId,
    '👉 https://qualisearchglobal.com/\n\n' +
    'From there you can explore Academic Press, browse journals, check submission guidelines, and find contact information.\n\n' +
    'You can also reach the team directly:\n' +
    '📧 qualisearchconsulting@gmail.com\n' +
    '📱 +639173039530'
  );
  await pause(600);
  await sendMainMenu(senderId);
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTBACK HANDLER — Button clicks & quick reply payloads
// ─────────────────────────────────────────────────────────────────────────────

const handlePostback = async (senderId, payload, title) => {
  logger.info('Handling postback', { senderId, payload, title });

  await messenger.sendTypingOn(senderId);
  await pause(700);

  switch (payload) {
    case 'GET_STARTED': {
      await handleWelcome(senderId);
      break;
    }

    case 'ARTICLE_SUBMISSION':
      await sendArticleSubmission(senderId);
      break;

    case 'PUBLICATION_PROCESS':
      await sendPublicationProcess(senderId);
      break;

    case 'PUBLICATION_FEE':
      await sendPublicationFee(senderId);
      break;

    case 'MANUSCRIPT_STATUS':
      await sendManuscriptStatus(senderId);
      break;

    case 'JOURNAL_GUIDELINES':
      await sendJournalGuidelines(senderId);
      break;

    case 'PROGRAMS_SERVICES':
      await sendProgramsServices(senderId);
      break;

    case 'CONTACT_SUPPORT':
      await sendContactSupport(senderId);
      break;

    default:
      await messenger.sendTextMessage(
        senderId,
        pick([
          'Let me show you what I can help you with! 😊',
          'Sure! Here are the things I can assist you with today. 👇',
        ])
      );
      await sendMainMenu(senderId);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OTHER EVENT HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const handleQuickReply = async (senderId, payload, text) => {
  logger.info('Handling quick reply', { senderId, payload, text });
  await handlePostback(senderId, payload, text);
};

const handleAttachment = async (senderId, attachments) => {
  logger.info('Handling attachment', { senderId, count: attachments.length });

  await messenger.sendTypingOn(senderId);
  await pause(800);

  const replies = [
    'Thanks for sending that! 📎 For actual manuscript file submissions though, please use the official portal so nothing gets lost.',
    'Oh, I see you sent a file! 📎 To make sure it reaches the right place, please submit it through the official platform.',
    'Got it! 📎 For manuscript submissions, the official portal is the safest way to submit — let me give you the link.',
  ];

  await messenger.sendTextMessage(senderId, pick(replies));
  await pause(700);
  await messenger.sendTypingOn(senderId);
  await pause(900);
  await messenger.sendTextMessage(
    senderId,
    '🌐 https://qualisearchglobal.com/\n\nSelect Academic Press → choose your journal → submit via the platform. Easy! 😊'
  );
  await sendMainMenu(senderId);
};

const handleRead = (senderId, watermark) => {
  logger.debug('Message read receipt', { senderId, watermark });
};

const handleDelivery = (senderId, watermark) => {
  logger.debug('Message delivery confirmed', { senderId, watermark });
};

module.exports = {
  handleTextMessage,
  handlePostback,
  handleQuickReply,
  handleAttachment,
  handleRead,
  handleDelivery,
};
