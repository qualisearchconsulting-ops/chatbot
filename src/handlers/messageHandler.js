const messenger = require('../services/messengerService');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// QUALISEARCH KNOWLEDGE BASE
// All official responses sourced from QualiSearch Global (qualisearchglobal.com)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send the main menu with quick reply options.
 */
const sendMainMenu = async (senderId) => {
  await messenger.sendQuickReplies(
    senderId,
    'Please select your concern:',
    [
      { content_type: 'text', title: '📝 Article Submission',   payload: 'ARTICLE_SUBMISSION'   },
      { content_type: 'text', title: '🔄 Publication Process',  payload: 'PUBLICATION_PROCESS'  },
      { content_type: 'text', title: '💳 Publication Fee',       payload: 'PUBLICATION_FEE'      },
      { content_type: 'text', title: '📊 Manuscript Status',     payload: 'MANUSCRIPT_STATUS'    },
      { content_type: 'text', title: '📋 Journal Guidelines',    payload: 'JOURNAL_GUIDELINES'   },
      { content_type: 'text', title: '🏛️ Programs & Services',  payload: 'PROGRAMS_SERVICES'    },
      { content_type: 'text', title: '📞 Contact Support',       payload: 'CONTACT_SUPPORT'      },
    ]
  );
};

/**
 * Handle a received text message from a user.
 * Matches user input to QualiSearch FAQ intents.
 */
const handleTextMessage = async (senderId, messageText) => {
  const text = messageText.toLowerCase().trim();

  logger.info('Handling text message', { senderId, text });

  // Show typing indicator while processing
  await messenger.sendTypingOn(senderId);

  // ── Greetings / Welcome ───────────────────────────────────────────────────
  if (['hi', 'hello', 'hey', 'start', 'get started', 'good morning', 'good afternoon', 'good evening'].some((w) => text.includes(w))) {
    await messenger.sendTextMessage(
      senderId,
      '👋 Hello! Welcome to QualiSearch.\n\nWe are an interdisciplinary research and knowledge institution committed to ethical scholarship, credible academic publishing, professional development, and meaningful social impact.\n\nHow may we assist you today?'
    );
    await sendMainMenu(senderId);
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
    text.includes('how long')
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
  if (text.includes('menu') || text.includes('option') || text.includes('back') || text.includes('more')) {
    await sendMainMenu(senderId);
    return;
  }

  // ── Default Fallback ──────────────────────────────────────────────────────
  await messenger.sendTextMessage(
    senderId,
    `Thank you for your message! 😊\n\nI'm sorry, I didn't quite understand that. Let me show you what I can help you with.`
  );
  await sendMainMenu(senderId);
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE FUNCTIONS — Each maps to one FAQ topic
// ─────────────────────────────────────────────────────────────────────────────

const sendArticleSubmission = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '📝 *How to Submit a Manuscript*\n\nTo submit your manuscript, please follow these steps:\n\n1️⃣ Visit https://qualisearchglobal.com/\n2️⃣ Select *Academic Press* from the QualiSearch Pillars of Innovation\n3️⃣ Choose the appropriate journal for your manuscript\n4️⃣ Create an author account on the Academic Press submission platform\n5️⃣ Log in to your account\n6️⃣ Complete the required manuscript information\n7️⃣ Upload your manuscript and the required supporting documents\n8️⃣ Review your submission details before clicking *Submit*\n\n✅ A confirmation will be sent after your manuscript has been successfully submitted.'
  );
  await sendMainMenu(senderId);
};

const sendAccountInfo = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '👤 *Do I Need an Account?*\n\nYes. Authors must create an account on the QualiSearch Academic Press submission platform before submitting a manuscript.\n\nThe account allows authors to:\n• Submit their work\n• Receive editorial notifications\n• Upload revisions\n• Monitor the progress of their manuscript\n\n🌐 *Where to Create an Account:*\nPlease visit https://qualisearchglobal.com/, select *Academic Press*, choose your preferred journal, and proceed to the registration or submission portal.'
  );
  await sendMainMenu(senderId);
};

const sendPublicationProcess = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '🔄 *Publication Process*\n\nThe publication process generally includes the following steps:\n\n1️⃣ Account Registration\n2️⃣ Manuscript Submission\n3️⃣ Initial Editorial Screening\n4️⃣ Peer Review\n5️⃣ Author Revision\n6️⃣ Final Evaluation\n7️⃣ Acceptance\n8️⃣ Payment\n9️⃣ Copyediting\n🔟 Layout Preparation\n1️⃣1️⃣ Author Proofreading\n1️⃣2️⃣ Online Publication'
  );
  await sendMainMenu(senderId);
};

const sendPublicationFee = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '💳 *Publication Fee*\n\nThe regular article publication fee for the *QualiSearch Journal of Educational Research and Practice* is:\n\n💰 *₱5,000*\n\nSpecial issue rates may vary depending on the official call for papers or partnership arrangement.\n\nThe applicable fee will be communicated to the author before publication.\n\n⚠️ *Important:* Payment does not guarantee manuscript acceptance. Authors should pay only after the manuscript has been formally accepted for publication.'
  );
  await sendMainMenu(senderId);
};

const sendWhenToPay = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '⏰ *When Should I Pay?*\n\nAuthors should pay only after the manuscript has:\n\n✅ Completed the required evaluation process\n✅ Been formally accepted for publication\n\n⚠️ *Payment does not guarantee manuscript acceptance.*\n\nThe editorial team will notify you when your manuscript is ready for payment.'
  );
  await sendMainMenu(senderId);
};

const sendManuscriptStatus = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '📊 *How to Check Manuscript Status*\n\nYou have two ways to check the status of your submission:\n\n1️⃣ *Online:* Log in to your QualiSearch Academic Press author account at https://qualisearchglobal.com/ to check your submission status.\n\n2️⃣ *Contact Editorial Team:* Reach out and provide the following details:\n   • Manuscript Title\n   • Corresponding Author\'s Name\n   • Journal Name\n   • Submission Date\n\nA representative will assist you with your inquiry.'
  );
  await sendMainMenu(senderId);
};

const sendJournalGuidelines = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '📋 *Journal Guidelines*\n\nFor official information about QualiSearch journals, publication standards, formatting requirements, and calls for papers, please visit:\n\n🌐 https://qualisearchglobal.com/\n\nFrom the website:\n1️⃣ Select *Academic Press* from the Pillars of Innovation\n2️⃣ Choose your preferred journal\n3️⃣ Review the submission guidelines for that journal\n\nA QualiSearch representative will assist you with concerns not covered on the website.'
  );
  await sendMainMenu(senderId);
};

const sendProgramsServices = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '🏛️ *QualiSearch Programs and Services*\n\nQualiSearch is an interdisciplinary research and knowledge institution offering:\n\n• 📚 *Academic Press* — Credible journal publications\n• 🎓 *Professional Development* — Training and workshops\n• 🔬 *Research Services* — Ethical scholarly research\n• 🌍 *Social Impact Programs* — Meaningful community engagement\n\nFor complete information about all programs, services, calls for papers, and partnerships:\n\n🌐 Visit https://qualisearchglobal.com/'
  );
  await sendMainMenu(senderId);
};

const sendContactSupport = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '📞 *Contact Support*\n\nFor concerns not covered by our automated assistant, a QualiSearch representative will be happy to assist you.\n\n🌐 Website: https://qualisearchglobal.com/\n📧 Visit the website for official contact details\n\nWhen contacting the editorial team, please provide:\n• Your full name\n• Manuscript title (if applicable)\n• Journal name\n• Nature of your concern\n\nThank you for reaching out to QualiSearch! 😊'
  );
  await sendMainMenu(senderId);
};

const sendWebsiteInfo = async (senderId) => {
  await messenger.sendTextMessage(
    senderId,
    '🌐 *QualiSearch Official Website*\n\nFor official information about QualiSearch, its Academic Press, journals, publication standards, calls for papers, and other programs:\n\n👉 https://qualisearchglobal.com/\n\nA QualiSearch representative will assist you with concerns not covered on the website.'
  );
  await sendMainMenu(senderId);
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTBACK HANDLER — Button clicks & quick reply payloads
// ─────────────────────────────────────────────────────────────────────────────

const handlePostback = async (senderId, payload, title) => {
  logger.info('Handling postback', { senderId, payload, title });

  await messenger.sendTypingOn(senderId);

  switch (payload) {
    case 'GET_STARTED':
      await messenger.sendTextMessage(
        senderId,
        '👋 Hello! Welcome to QualiSearch.\n\nWe are an interdisciplinary research and knowledge institution committed to ethical scholarship, credible academic publishing, professional development, and meaningful social impact.\n\nHow may we assist you today?'
      );
      await sendMainMenu(senderId);
      break;

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
        `Thank you for your message! Let me show you what I can help you with.`
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
  await messenger.sendTextMessage(
    senderId,
    '📎 Thank you for sending that!\n\nFor manuscript file submissions, please use the official submission portal:\n🌐 https://qualisearchglobal.com/\n\nSelect *Academic Press* → Choose your journal → Submit via the platform.'
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
