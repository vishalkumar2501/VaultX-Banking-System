// scripts/generate_policy_pdf.js
// Generates official dummy VaultX Bank Policy PDF for RAG pipeline

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

function generateBankPolicyPDF() {
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, "VAULTX_BANK_POLICY_2026.pdf");
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    // Title & Header
    doc.fontSize(20).fillColor("#1e3a8a").text("VaultX Bank Limited", { align: "center" });
    doc.fontSize(14).fillColor("#1d4ed8").text("Official Regulatory Guidelines, Interest Rates & Customer Terms (FY 2026)", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#64748b").text("Document ID: VX-DOC-2026-RAG-001 | Effective Date: October 1, 2026 | Version: 4.2", { align: "center" });
    doc.moveDown(1.5);

    // Section 1
    doc.fontSize(13).fillColor("#0f172a").text("1. SAVINGS & CURRENT ACCOUNT MINIMUM BALANCE RULES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "VaultX Bank mandates specific Minimum Average Balance (MAB) requirements to ensure liquidity stability:\n" +
        "• Regular Savings Account: Minimum Quarterly Balance is Rs 2,500. Non-maintenance penalty is Rs 150 + 18% GST per quarter. Customers receive 5 free ATM withdrawals per month at any bank ATM nationwide.\n" +
        "• Gold Privilege Savings Account: Minimum Average Balance (MAB) is Rs 10,000. Non-maintenance penalty is Rs 250 + 18% GST. Customers get unlimited free withdrawals at VaultX ATMs and 10 free at other ATMs.\n" +
        "• Platinum Elite Savings Account: Required MAB is Rs 25,000. Penalty for non-maintenance is Rs 500 + GST. Includes unlimited free ATM transactions at any bank ATM across India.\n" +
        "• Corporate Salary Zero-Balance Account: Required balance is Rs 0 (Zero Balance). Absolutely no minimum balance penalties apply.\n" +
        "• Business Current Account: Minimum Average Balance is Rs 50,000. Quarterly shortfall penalty is Rs 750 + GST. Includes 50 free cash deposits per month.\n"
    );
    doc.moveDown(1);

    // Section 2
    doc.fontSize(13).fillColor("#0f172a").text("2. RETAIL LOANS & INTEREST RATES SCHEDULE", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "All retail loans are benchmarked to the RBI External Benchmark Lending Rate (EBLR):\n" +
        "• VaultX Home Loan: Starting interest rate is 8.35% per annum for credit scores of 750 and above. Maximum loan tenure is up to 30 years. Processing fee is 0.25% of the loan amount, capped at a maximum of Rs 10,000. Floating rate home loans have zero prepayment penalty.\n" +
        "• VaultX Personal Loan: Unsecured personal loans range from Rs 50,000 up to Rs 25,00,000. Interest rates are between 10.25% and 14.50% per annum depending on salary and credit score. Repayment tenure ranges from 12 to 60 months.\n" +
        "• VaultX Electric Vehicle (EV) Car Loan: Special subsidized green vehicle rate of 8.65% per annum with 100% on-road financing. Standard diesel/petrol vehicle car loan rate is 9.15% per annum.\n" +
        "• VaultX Global Education Loan: Fixed 8.90% per annum for domestic and overseas universities with a moratorium period of Course Duration + 12 months.\n"
    );
    doc.moveDown(1);

    // Section 3
    doc.fontSize(13).fillColor("#0f172a").text("3. FIXED DEPOSIT (FD) & RECURRING DEPOSIT (RD) RATES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "Domestic Fixed Deposit annual interest rates (for deposits under Rs 2 Crores):\n" +
        "• 7 Days to 45 Days: 3.50% p.a. (Senior Citizens: 3.50%)\n" +
        "• 46 Days to 179 Days: 4.75% p.a. (Senior Citizens: 5.00%)\n" +
        "• 180 Days to 364 Days: 6.00% p.a. (Senior Citizens: 6.50%)\n" +
        "• 1 Year to less than 2 Years: 7.10% p.a. (Senior Citizens: 7.60%)\n" +
        "• 2 Years to 3 Years (Special High-Return Bucket): 7.40% p.a. (Senior Citizens: 7.90% p.a., Super Senior Citizens aged 80+ get 8.15% p.a.)\n" +
        "• 3 Years 1 Day to 5 Years (Tax Saver FD under Section 80C): 6.90% p.a. (Senior Citizens: 7.40% p.a.)\n" +
        "• Premature FD Withdrawal Policy: A penalty of 0.50% is deducted from the contracted interest rate if the deposit is broken prematurely within 6 months.\n"
    );
    doc.moveDown(1);

    // Section 4
    doc.fontSize(13).fillColor("#0f172a").text("4. DIGITAL PAYMENTS, TRANSFER LIMITS & FEES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "• UPI Daily Transaction Limit: Rs 1,00,000 per 24-hour cycle or maximum 20 transactions per account per day as mandated by NPCI. P2P transfers are 100% free.\n" +
        "• ATM Cash Withdrawal Limits: Rs 50,000 per day for Gold Visa/Mastercard Debit Cards; Rs 1,00,000 per day for Platinum Elite Debit Cards.\n" +
        "• IMPS Instant Transfer: Maximum Rs 5,00,000 per day. Transactions between Rs 1 Lakh and Rs 5 Lakh incur a nominal fee of Rs 5 + GST.\n" +
        "• NEFT and RTGS Transfers: Free of charge 24x7x365 via VaultX Internet Banking and Mobile App.\n"
    );
    doc.moveDown(1);

    // Section 5
    doc.fontSize(13).fillColor("#0f172a").text("5. FRAUD PROTECTION, ZERO LIABILITY & GRIEVANCE REDRESSAL", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "In accordance with Reserve Bank of India (RBI) Customer Protection Guidelines:\n" +
        "• Zero Liability Window: If a customer reports an unauthorized electronic transaction within 3 working days of receiving the SMS/email alert, the customer has ZERO liability. The bank must credit the disputed amount back within 10 working days.\n" +
        "• Delayed Reporting (4 to 7 Working Days): Customer liability is strictly capped at Rs 10,000 for regular savings accounts and Rs 25,000 for current accounts.\n" +
        "• Principal Nodal Grievance Redressal Officer:\n" +
        "  Name: Mr. Rajeshwar Iyer\n" +
        "  Address: VaultX Tower, Cyber City, Sector 44, Gurugram, Haryana - 122002\n" +
        "  Toll-Free Grievance Helpline: 1800-425-9999\n" +
        "  Official Email: grievance@vaultxbank.internal\n" +
        "• Banking Ombudsman Escalation: If a customer complaint is not resolved within 30 calendar days, the customer has the statutory right to escalate to the RBI Banking Ombudsman portal.\n"
    );

    doc.moveDown(1);

    // Section 6: Official Retail Products & Commodities Price Schedule
    doc.fontSize(13).fillColor("#0f172a").text("6. RETAIL PRODUCTS & COMMODITIES PRICE LIST", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#334155").text(
        "Official verified retail catalog prices:\n" +
        "• Banana Pack 7: The price of Banana Pack 7 is n715.\n" +
        "• 1kg Sugar: The price of 1kg sugar is Rs 45.\n" +
        "• Apple Royal Gala Pack 4: The price of Apple Royal Gala Pack 4 is n450.\n" +
        "• Basmati Rice 5kg: The price of Basmati Rice 5kg is Rs 380.\n" +
        "• Organic Milk 1 Litre: The price of Organic Milk 1 Litre is Rs 68.\n" +
        "• Whole Wheat Atta 10kg: The price of Whole Wheat Atta 10kg is Rs 420.\n"
    );

    doc.end();

    writeStream.on("finish", () => {
        console.log(`[PDF GENERATED SUCCESSFULLY]: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
    });
}

generateBankPolicyPDF();
