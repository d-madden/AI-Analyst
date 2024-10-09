// dcfModel.js

async function calculateDCF(ticker, financialData, marketData, riskMetrics, options = {}) {
  console.log(`Starting DCF calculation for ${ticker}`);
  try {
    // Extract data
    const { data: reports } = financialData;
    let { stockPrice, sharesOutstanding } = marketData;
    const { beta, riskFreeRate, marketRiskPremium } = riskMetrics;

    // Ensure data is available
    if (!reports || reports.length === 0) {
      throw new Error(`No financial reports available for ${ticker}`);
    }

    // Use the latest annual report
    const annualReports = reports.filter(
      (report) => report.form === '10-K' || report.quarter === 0
    );
    if (annualReports.length === 0) {
      throw new Error(`No annual financial reports available for ${ticker}`);
    }

    const latestReport = annualReports[0]; // Assuming the first report is the latest
    const { report } = latestReport;

    if (!report || !report.bs || !report.cf || !report.ic) {
      throw new Error(`Incomplete financial report data for ${ticker}`);
    }

    // Helper function to extract values
    function getValueFromReport(reportArray, concepts) {
      for (const item of reportArray) {
        if (concepts.includes(item.concept)) {
          return parseFloat(item.value);
        }
      }
      return NaN; // Return NaN if not found
    }

    // Extract financial metrics from income statement
    const incomeStatementData = report.ic;

    let revenue = getValueFromReport(incomeStatementData, [
        'us-gaap_Revenues',
        'us-gaap_SalesRevenueNet',
        'us-gaap_SalesRevenueServicesNet',
        'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax',
      ]);
  
      let operatingIncome = getValueFromReport(incomeStatementData, [
        'us-gaap_OperatingIncomeLoss',
      ]);
  
      let incomeBeforeTax = getValueFromReport(incomeStatementData, [
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxes',
      ]);
  
      let incomeTaxExpense = getValueFromReport(incomeStatementData, [
        'us-gaap_IncomeTaxExpenseBenefit',
      ]);

    // Extract financial metrics from cash flow statement
    const cashFlowData = report.cf;

    // Extract depreciation and amortization
      let depreciation = getValueFromReport(cashFlowData, [
        'us-gaap_DepreciationAndAmortization',
        'us-gaap_DepreciationDepletionAndAmortization',
        'us-gaap_NoncashAdjustmentsToReconcileNetIncomeLossToCashProvidedByUsedInOperatingActivities',
        'us-gaap_DepreciationAmortizationAndOther',
        'us-gaap_DepreciationAmortizationAndOtherNoncashItems'
      ]);


    if (isNaN(depreciation)) {
      console.warn(`Depreciation data missing for ${ticker}, defaulting to $12,000,000,000`);
      depreciation = 12_000_000_000; // Default to $12 billion based on real data
    }

    console.log(`Depreciation: ${depreciation.toFixed(2)}`);

    // Extract capital expenditures
    let capitalExpenditures = getValueFromReport(cashFlowData, [
      'us-gaap_PaymentsToAcquirePropertyPlantAndEquipment',
    ]);

    if (isNaN(capitalExpenditures)) {
      console.warn(`Capital expenditures data missing for ${ticker}, defaulting to $27,100,000,000`);
      capitalExpenditures = 27_100_000_000; // Default to $27.1 billion based on real data
    }

    // CapEx is typically negative (cash outflow), so take absolute value
    capitalExpenditures = Math.abs(capitalExpenditures);

    console.log(`Capital Expenditures: ${capitalExpenditures.toFixed(2)}`);

    // Compute Change in Working Capital from components
    const deltaAccountsReceivable = getValueFromReport(cashFlowData, [
      'us-gaap_IncreaseDecreaseInAccountsReceivable',
    ]) || 0;

    const deltaInventories = getValueFromReport(cashFlowData, [
      'us-gaap_IncreaseDecreaseInInventories',
    ]) || 0;

    const deltaOtherCurrentAssets = getValueFromReport(cashFlowData, [
      'us-gaap_IncreaseDecreaseInOtherCurrentAssets',
    ]) || 0;

    const deltaAccountsPayable = getValueFromReport(cashFlowData, [
      'us-gaap_IncreaseDecreaseInAccountsPayable',
    ]) || 0;

    const deltaOtherCurrentLiabilities = getValueFromReport(cashFlowData, [
      'us-gaap_IncreaseDecreaseInOtherCurrentLiabilities',
    ]) || 0;

    // Calculate Change in Working Capital
    const increaseInAssets =
      deltaAccountsReceivable + deltaInventories + deltaOtherCurrentAssets;
    const increaseInLiabilities =
      deltaAccountsPayable + deltaOtherCurrentLiabilities;

    let changeInWorkingCapital = increaseInAssets - increaseInLiabilities;

    if (isNaN(changeInWorkingCapital)) {
      console.warn(`Change in working capital data missing for ${ticker}, defaulting to $4,100,000,000`);
      changeInWorkingCapital = 4_100_000_000; // Default to $4.1 billion based on real data
    }

    console.log(`Change in Working Capital: ${changeInWorkingCapital.toFixed(2)}`);

    // Ensure units are correct
    if (revenue > 1_000_000_000_000) {
      console.log(`Adjusting units for ${ticker}, assuming financial data is in thousands`);
      revenue /= 1_000;
      operatingIncome /= 1_000;
      incomeBeforeTax /= 1_000;
      incomeTaxExpense /= 1_000;
      depreciation /= 1_000;
      capitalExpenditures /= 1_000;
      changeInWorkingCapital /= 1_000;
    }

    // Check for NaN values
    if (
      isNaN(revenue) ||
      isNaN(operatingIncome) ||
      isNaN(incomeBeforeTax) ||
      isNaN(incomeTaxExpense)
    ) {
      throw new Error(`Invalid income statement data for ${ticker}`);
    }

    // Calculate tax rate
    let taxRate = incomeTaxExpense / incomeBeforeTax;
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 0.5) {
      console.warn(`Invalid tax rate for ${ticker}, defaulting to 18%`);
      taxRate = 0.18; // Default to 18% based on real data
    }

    console.log(`Tax Rate: ${(taxRate * 100).toFixed(2)}%`);

    // Calculate NOPAT
    const nopat = operatingIncome * (1 - taxRate);
    console.log(`NOPAT: ${nopat.toFixed(2)}`);

    // Calculate initial FCF
    const initialFCF =
      nopat + depreciation - capitalExpenditures - changeInWorkingCapital;
    console.log(`Initial Free Cash Flow for ${ticker}: ${initialFCF.toFixed(2)}`);

    // Set assumptions
    const growthRate = options.growthRate || 0.10; // 10% growth rate based on historical data
    const projectionYears = options.projectionYears || 5;
    const terminalGrowthRate = options.terminalGrowthRate || 0.03; // 3% terminal growth rate

    // Project future cash flows
    let projectedFCFs = [];
    let currentFCF = initialFCF;

    console.log(`Projecting future cash flows for ${ticker}`);
    for (let i = 1; i <= projectionYears; i++) {
      currentFCF *= 1 + growthRate;
      projectedFCFs.push(currentFCF);
      console.log(`Year ${i} projected FCF: ${currentFCF.toFixed(2)}`);
    }

    // Calculate WACC
    const costOfEquity = riskFreeRate + beta * marketRiskPremium;
    let wacc = costOfEquity; // Assuming no debt for simplicity

    // Adjust WACC if the company has debt
    const balanceSheetData = report.bs;

    let totalDebt = getValueFromReport(balanceSheetData, [
      'us-gaap_LongTermDebtNoncurrent',
      'us-gaap_LongTermDebtAndCapitalLeaseObligations',
      'us-gaap_DebtCurrent',
      'us-gaap_LongTermDebtCurrent',
      'us-gaap_LongTermDebt',
    ]);

    if (isNaN(totalDebt)) {
      console.warn(`Total debt data missing for ${ticker}, defaulting to $44,100,000,000`);
      totalDebt = 44_100_000_000; // Default to $44.1 billion based on real data
    }

    // Calculate market value of equity (Market Cap)
    const marketCap = stockPrice * sharesOutstanding;

    // Calculate proportion of debt and equity
    const totalCapital = totalDebt + marketCap;
    const proportionDebt = totalDebt / totalCapital;
    const proportionEquity = marketCap / totalCapital;

    // Assume cost of debt
    const costOfDebt = 0.03; // 3% cost of debt
    const corporateTaxRate = taxRate;

    // Recalculate WACC with debt included
    wacc =
      proportionEquity * costOfEquity +
      proportionDebt * costOfDebt * (1 - corporateTaxRate);

    console.log(`WACC for ${ticker}: ${(wacc * 100).toFixed(2)}%`);

    // Ensure WACC is reasonable
    if (wacc < 0 || wacc > 0.15) {
      console.warn(`Unreasonable WACC for ${ticker}, adjusting to 8%`);
      wacc = 0.08; // Set a default WACC
    }

    // Calculate Terminal Value
    const terminalValue =
      (projectedFCFs[projectionYears - 1] * (1 + terminalGrowthRate)) /
      (wacc - terminalGrowthRate);
    console.log(`Terminal Value for ${ticker}: ${terminalValue.toFixed(2)}`);

    // Discount projected cash flows and terminal value to present value
    let presentValue = 0;
    for (let i = 0; i < projectionYears; i++) {
      const discountedFCF = projectedFCFs[i] / Math.pow(1 + wacc, i + 1);
      presentValue += discountedFCF;
      console.log(`Year ${i + 1} discounted FCF: ${discountedFCF.toFixed(2)}`);
    }
    const discountedTerminalValue =
      terminalValue / Math.pow(1 + wacc, projectionYears);
    presentValue += discountedTerminalValue;
    console.log(`Discounted Terminal Value: ${discountedTerminalValue.toFixed(2)}`);

    // Adjust for cash and debt
    let cashAndEquivalents = getValueFromReport(balanceSheetData, [
      'us-gaap_CashAndCashEquivalentsAtCarryingValue',
      'us-gaap_CashCashEquivalentsAndShortTermInvestments',
    ]);

    if (isNaN(cashAndEquivalents)) {
      console.warn(`Cash and equivalents data missing for ${ticker}, defaulting to $111,000,000,000`);
      cashAndEquivalents = 111_000_000_000; // Default to $111 billion based on real data
    }

    console.log(`Cash and Equivalents: ${cashAndEquivalents.toFixed(2)}`);
    console.log(`Total Debt: ${totalDebt.toFixed(2)}`);

    // Ensure units for cash and debt are consistent
    if (cashAndEquivalents > 1_000_000_000_000) {
      console.log(`Adjusting units for cash and debt, assuming values are in thousands`);
      cashAndEquivalents /= 1_000;
      totalDebt /= 1_000;
    }

    // Calculate Equity Value
    const equityValue = presentValue + cashAndEquivalents - totalDebt;
    console.log(`Equity Value for ${ticker}: ${equityValue.toFixed(2)}`);

    // Correctly handle shares outstanding
    // Finnhub returns sharesOutstanding in millions, multiply by 1,000,000
    if (sharesOutstanding < 1_000_000) {
      console.log(
        `Adjusting shares outstanding for ${ticker}, assuming value is in millions`
      );
      sharesOutstanding *= 1_000_000;
    }

    // Ensure sharesOutstanding is a reasonable number
    if (sharesOutstanding < 1_000_000 || sharesOutstanding > 10_000_000_000) {
      throw new Error(`Invalid shares outstanding for ${ticker}`);
    }

    // Calculate Price Target
    const priceTarget = equityValue / sharesOutstanding;
    console.log(`Calculated Price Target for ${ticker}: ${priceTarget.toFixed(2)}`);

    // Prepare assumptions
    const assumptions = {
      growthRate,
      projectionYears,
      terminalGrowthRate,
      wacc,
      costOfEquity,
      beta,
      riskFreeRate,
      marketRiskPremium,
      taxRate,
    };

    return {
      priceTarget,
      wacc,
      assumptions,
    };
  } catch (error) {
    console.error(`Error in DCF calculation for ${ticker}:`, error.message);
    throw error;
  }
}

module.exports = {
  calculateDCF,
};
