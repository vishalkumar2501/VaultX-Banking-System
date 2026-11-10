const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

/* -------------------------------------------------------------------------- */
/*                               Brand / Config                               */
/* -------------------------------------------------------------------------- */

const BRAND = {
    name: 'AegisLedger',
    ledgerName: 'AegisLedger Core Banking',
    color: '#0B1E59',
    accent: '#10B981',
    supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
    supportPhone: process.env.SUPPORT_PHONE || '1800-000-0000',
    website: process.env.WEBSITE_URL || '#',
};

const DEFAULT_CURRENCY = process.env.CURRENCY_SYMBOL || '₹';

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

// Prevent HTML injection through user-provided values (name, etc.)
const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// Show only last 4 characters of an account, e.g. XXXXXX1234
const maskAccount = (account = '') => {
    const str = String(account);
    if (str.length <= 4) return str;
    return 'X'.repeat(str.length - 4) + str.slice(-4);
};

const formatAmount = (amount, currency = DEFAULT_CURRENCY) => {
    const num = Number(amount);
    if (Number.isNaN(num)) return `${currency}${amount}`;
    return `${currency}${num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDateTime = (date = new Date()) =>
    new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }) + ' IST';

const generateReferenceId = () =>
    'TXN' + crypto.randomBytes(6).toString('hex').toUpperCase();

/* -------------------------------------------------------------------------- */
/*                             HTML Email Template                            */
/* -------------------------------------------------------------------------- */

const detailsTable = (rows) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e9f0;border-radius:8px;margin:20px 0;">
        ${rows
            .map(
                ([label, value], i) => `
            <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;width:45%;">${label}</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;text-align:right;">${value}</td>
            </tr>`
            )
            .join('')}
    </table>`;

const buildEmailTemplate = ({ title, statusColor, statusLabel, bodyHtml, preheader = '' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f4f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f4f9;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                    <!-- Header -->
                    <tr>
                        <td style="background:${BRAND.color};padding:24px 32px;">
                            <h1 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:0.5px;">🏦 ${BRAND.name}</h1>
                        </td>
                    </tr>

                    <!-- Status banner -->
                    <tr>
                        <td style="background:${statusColor};padding:10px 32px;">
                            <span style="font-size:13px;font-weight:700;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">${statusLabel}</span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
                            ${bodyHtml}
                        </td>
                    </tr>

                    <!-- Security notice -->
                    <tr>
                        <td style="padding:0 32px 24px;">
                            <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:4px;font-size:12.5px;color:#7a5b00;line-height:1.5;">
                                <strong>🔒 Security Tip:</strong> ${BRAND.name} will never ask for your password, PIN, OTP, CVV or full card details over email, call or SMS. If you did not initiate this activity or notice anything suspicious, contact us immediately.
                            </div>
                        </td>
                    </tr>

                    <!-- Support -->
                    <tr>
                        <td style="padding:0 32px 28px;font-size:13.5px;color:#4b5563;line-height:1.6;">
                            Need help? Reach us at
                            <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.accent};text-decoration:none;">${BRAND.supportEmail}</a>
                            or call <strong>${BRAND.supportPhone}</strong> (24x7).
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e9f0;font-size:11.5px;color:#9ca3af;line-height:1.6;">
                            This is an automated message, please do not reply to this email.<br />
                            This email and any attachments are confidential and intended solely for the addressee.<br />
                            &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const textFooter = `\n\n---\nSecurity Tip: ${BRAND.name} will never ask for your password, PIN, OTP, CVV or full card details over email, call or SMS. If you did not initiate this activity, contact us immediately.\n\nSupport: ${BRAND.supportEmail} | ${BRAND.supportPhone} (24x7)\n\nThis is an automated message, please do not reply.\n(c) ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`;

/* -------------------------------------------------------------------------- */
/*                               Function to send                             */
/* -------------------------------------------------------------------------- */

// Function to send email
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Backend Fintech" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

/* -------------------------------------------------------------------------- */
/*                            Public email functions                          */
/* -------------------------------------------------------------------------- */

/**
 * Registration / Welcome email
 * (same signature as before)
 */
async function sendRegistrationEmail(userEmail, name) {
    const safeName = escapeHtml(name);
    const subject = 'Welcome to Backend Fintech! Your account has been created';

    const text = `Dear ${name},

Welcome to ${BRAND.name}! Your account has been created successfully.

Registered email : ${userEmail}
Registered on    : ${formatDateTime()}

What you can do next:
 - Complete your profile / KYC verification
 - Set up a strong password and keep it confidential
 - Create your account and start making secure transactions

If you did not create this account, please contact our support team immediately.

Warm regards,
The ${BRAND.name} Team${textFooter}`;

    const bodyHtml = `
        <p style="margin:0 0 16px;font-size:17px;">Dear <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 16px;">Welcome to <strong>${BRAND.name}</strong>! Your account has been created successfully and you are now part of a secure, modern banking experience.</p>

        ${detailsTable([
            ['Registered Email', escapeHtml(userEmail)],
            ['Registered On', formatDateTime()],
            ['Account Status', '<span style="color:#16a34a;">Active</span>'],
        ])}

        <p style="margin:0 0 8px;font-weight:600;">Next steps to get started:</p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#374151;">
            <li>Complete your profile and KYC verification</li>
            <li>Use a strong, unique password and never share it</li>
            <li>Create your account and start transacting securely</li>
        </ul>

        <p style="margin:0 0 16px;">If you did not create this account, please contact our support team right away.</p>
        <p style="margin:0;">Warm regards,<br /><strong>The ${BRAND.name} Team</strong></p>`;

    const html = buildEmailTemplate({
        title: 'Welcome to Backend Fintech',
        statusColor: '#16a34a',
        statusLabel: 'Registration Successful',
        bodyHtml,
        preheader: 'Your Backend Fintech account has been created successfully.',
    });

    await sendEmail(userEmail, subject, text, html);
}

/**
 * Transaction success email
 * (same required params; optional 5th param `options` for extra details)
 * options: { transactionId, currency, date, balance, remarks }
 */
async function sendTransactionEmail(userEmail, name, amount, toAccount, options = {}) {
    const {
        transactionId = generateReferenceId(),
        currency = DEFAULT_CURRENCY,
        date = new Date(),
        balance,
        remarks,
    } = options;

    const safeName = escapeHtml(name);
    const formattedAmount = formatAmount(amount, currency);
    const maskedTo = maskAccount(toAccount);
    const subject = `Transaction Successful | ${formattedAmount} | Ref ${transactionId}`;

    const rows = [
        ['Transaction Type', 'Fund Transfer (Debit)'],
        ['Amount', `<span style="font-size:16px;color:#dc2626;">- ${formattedAmount}</span>`],
        ['To Account', escapeHtml(maskedTo)],
        ['Date &amp; Time', formatDateTime(date)],
        ['Reference ID', escapeHtml(transactionId)],
        ['Status', '<span style="color:#16a34a;">Successful</span>'],
    ];
    const textRows = [
        `Transaction Type : Fund Transfer (Debit)`,
        `Amount           : ${formattedAmount}`,
        `To Account       : ${maskedTo}`,
        `Date & Time      : ${formatDateTime(date)}`,
        `Reference ID     : ${transactionId}`,
        `Status           : Successful`,
    ];
    if (remarks) {
        rows.splice(3, 0, ['Remarks', escapeHtml(remarks)]);
        textRows.splice(3, 0, `Remarks          : ${remarks}`);
    }
    if (balance !== undefined && balance !== null) {
        rows.push(['Available Balance', formatAmount(balance, currency)]);
        textRows.push(`Available Balance: ${formatAmount(balance, currency)}`);
    }

    const text = `Dear ${name},

Your transaction has been processed successfully. Details are given below:

${textRows.join('\n')}

Please keep the Reference ID for any future queries. If you did not authorise this transaction, contact us immediately to block your account.

Warm regards,
The ${BRAND.ledgerName} Team${textFooter}`;

    const bodyHtml = `
        <p style="margin:0 0 16px;font-size:17px;">Dear <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 8px;">Your transaction of <strong>${formattedAmount}</strong> to account <strong>${escapeHtml(maskedTo)}</strong> has been processed successfully.</p>

        ${detailsTable(rows)}

        <p style="margin:0 0 16px;">Please keep the <strong>Reference ID</strong> for any future queries or disputes.</p>
        <p style="margin:0 0 16px;color:#b91c1c;font-size:14px;"><strong>Not you?</strong> If you did not authorise this transaction, contact us immediately so we can secure your account.</p>
        <p style="margin:0;">Warm regards,<br /><strong>The ${BRAND.ledgerName} Team</strong></p>`;

    const html = buildEmailTemplate({
        title: 'Transaction Successful',
        statusColor: '#16a34a',
        statusLabel: 'Transaction Successful',
        bodyHtml,
        preheader: `Your transaction of ${formattedAmount} was successful. Ref: ${transactionId}`,
    });

    await sendEmail(userEmail, subject, text, html);
}

/**
 * Transaction failure email
 * (same required params; optional 5th param `options` for extra details)
 * options: { transactionId, currency, date, reason }
 */
async function sendTransactionFailureEmail(userEmail, name, amount, toAccount, options = {}) {
    const {
        transactionId = generateReferenceId(),
        currency = DEFAULT_CURRENCY,
        date = new Date(),
        reason = 'The transaction could not be completed due to a technical or processing issue.',
    } = options;

    const safeName = escapeHtml(name);
    const formattedAmount = formatAmount(amount, currency);
    const maskedTo = maskAccount(toAccount);
    const subject = `Transaction Failed | ${formattedAmount} | Ref ${transactionId}`;

    const rows = [
        ['Transaction Type', 'Fund Transfer'],
        ['Amount', formattedAmount],
        ['To Account', escapeHtml(maskedTo)],
        ['Date &amp; Time', formatDateTime(date)],
        ['Reference ID', escapeHtml(transactionId)],
        ['Status', '<span style="color:#dc2626;">Failed</span>'],
        ['Reason', escapeHtml(reason)],
    ];

    const text = `Dear ${name},

We regret to inform you that your recent transaction could not be completed.

Transaction Type : Fund Transfer
Amount           : ${formattedAmount}
To Account       : ${maskedTo}
Date & Time      : ${formatDateTime(date)}
Reference ID     : ${transactionId}
Status           : Failed
Reason           : ${reason}

No money has been debited from your account. If any amount was deducted, it will be reversed automatically within 5-7 working days. You may try the transaction again after some time.

Warm regards,
The ${BRAND.ledgerName} Team${textFooter}`;

    const bodyHtml = `
        <p style="margin:0 0 16px;font-size:17px;">Dear <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 8px;">We regret to inform you that your transaction of <strong>${formattedAmount}</strong> to account <strong>${escapeHtml(maskedTo)}</strong> could not be completed.</p>

        ${detailsTable(rows)}

        <div style="background:#f0f9ff;border-left:4px solid ${BRAND.accent};padding:14px 16px;border-radius:4px;font-size:14px;margin:0 0 16px;">
            <strong>What happens next?</strong><br />
            No money has been debited from your account. If any amount was deducted, it will be reversed automatically within <strong>5-7 working days</strong>. You may retry the transaction after some time.
        </div>

        <p style="margin:0 0 16px;">If the issue persists, please contact support and share the Reference ID above.</p>
        <p style="margin:0;">Warm regards,<br /><strong>The ${BRAND.ledgerName} Team</strong></p>`;

    const html = buildEmailTemplate({
        title: 'Transaction Failed',
        statusColor: '#dc2626',
        statusLabel: 'Transaction Failed',
        bodyHtml,
        preheader: `Your transaction of ${formattedAmount} could not be completed. Ref: ${transactionId}`,
    });

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};