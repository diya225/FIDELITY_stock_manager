import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stocks = [
  ["TCS.NS", "Tata Consultancy Services", "IT"],
  ["INFY.NS", "Infosys Ltd.", "IT"],
  ["WIPRO.NS", "Wipro Ltd.", "IT"],
  ["HCLTECH.NS", "HCL Technologies", "IT"],
  ["TECHM.NS", "Tech Mahindra", "IT"],
  ["HDFCBANK.NS", "HDFC Bank", "Banking"],
  ["ICICIBANK.NS", "ICICI Bank", "Banking"],
  ["KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"],
  ["SBIN.NS", "State Bank of India", "Banking"],
  ["AXISBANK.NS", "Axis Bank", "Banking"],
  ["RELIANCE.NS", "Reliance Industries", "Energy"],
  ["ONGC.NS", "Oil & Natural Gas Corp", "Energy"],
  ["NTPC.NS", "NTPC Ltd.", "Energy"],
  ["POWERGRID.NS", "Power Grid Corporation", "Energy"],
  ["BPCL.NS", "Bharat Petroleum", "Energy"],
  ["HINDUNILVR.NS", "Hindustan Unilever", "FMCG"],
  ["ITC.NS", "ITC Ltd.", "FMCG"],
  ["NESTLEIND.NS", "Nestle India", "FMCG"],
  ["DABUR.NS", "Dabur India", "FMCG"],
  ["BRITANNIA.NS", "Britannia Industries", "FMCG"],
  ["SUNPHARMA.NS", "Sun Pharmaceutical", "Pharma"],
  ["DRREDDY.NS", "Dr. Reddy's Laboratories", "Pharma"],
  ["CIPLA.NS", "Cipla Ltd.", "Pharma"],
  ["DIVISLAB.NS", "Divi's Laboratories", "Pharma"],
  ["APOLLOHOSP.NS", "Apollo Hospitals", "Pharma"],
  ["MARUTI.NS", "Maruti Suzuki India", "Automobile"],
  ["TATAMOTORS.NS", "Tata Motors", "Automobile"],
  ["M&M.NS", "Mahindra & Mahindra", "Automobile"],
  ["BAJAJ-AUTO.NS", "Bajaj Auto", "Automobile"],
  ["HEROMOTOCO.NS", "Hero MotoCorp", "Automobile"],
  ["TATASTEEL.NS", "Tata Steel", "Metals"],
  ["JSWSTEEL.NS", "JSW Steel", "Metals"],
  ["HINDALCO.NS", "Hindalco Industries", "Metals"],
  ["VEDL.NS", "Vedanta Ltd.", "Metals"],
  ["COALINDIA.NS", "Coal India", "Metals"],
  ["BHARTIARTL.NS", "Bharti Airtel", "Telecom"],
  ["ASIANPAINT.NS", "Asian Paints", "Consumer"],
  ["ULTRACEMCO.NS", "UltraTech Cement", "Infrastructure"],
  ["TITAN.NS", "Titan Company", "Consumer"],
  ["LT.NS", "Larsen & Toubro", "Infrastructure"],
  ["BAJFINANCE.NS", "Bajaj Finance", "NBFC"],
  ["BAJAJFINSV.NS", "Bajaj Finserv", "NBFC"],
  ["HDFCLIFE.NS", "HDFC Life Insurance", "Insurance"],
  ["SBILIFE.NS", "SBI Life Insurance", "Insurance"],
  ["INDUSINDBK.NS", "IndusInd Bank", "Banking"],
  ["ADANIPORTS.NS", "Adani Ports & SEZ", "Infrastructure"],
  ["GRASIM.NS", "Grasim Industries", "Conglomerate"],
  ["EICHERMOT.NS", "Eicher Motors", "Automobile"],
  ["SHREECEM.NS", "Shree Cement", "Infrastructure"],
  ["UPL.NS", "UPL Ltd.", "Chemicals"]
] as const;

const seededPrice = (index: number) => Math.round((650 + index * 71 + (index % 7) * 130) * 100) / 100;

const main = async () => {
  for (const [index, stock] of stocks.entries()) {
    const [ticker, name, sector] = stock;
    const currentPrice = seededPrice(index);
    const created = await prisma.stock.upsert({
      where: { ticker },
      update: { name, sector, currentPrice, changePct: ((index % 9) - 4) * 0.7 },
      create: { ticker, name, sector, exchange: "NSE", currentPrice, changePct: ((index % 9) - 4) * 0.7 }
    });

    for (let offset = 0; offset < 90; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - (90 - offset));
      date.setHours(0, 0, 0, 0);
      const close = currentPrice * (0.88 + offset / 750 + ((index + offset) % 5) / 200);
      await prisma.stockPrice.upsert({
        where: { stockId_date: { stockId: created.id, date } },
        update: {},
        create: {
          stockId: created.id,
          date,
          open: close * 0.99,
          high: close * 1.02,
          low: close * 0.98,
          close,
          volume: BigInt(100000 + index * 1000 + offset * 50)
        }
      });
    }
  }

  const users = [
    { email: "admin@stockmanager.app", password: "Admin1234!", fullName: "Platform Admin", role: "ADMIN" as const },
    { email: "rahul@demo.com", password: "Demo1234!", fullName: "Rahul Sharma", role: "USER" as const },
    { email: "priya@demo.com", password: "Demo1234!", fullName: "Priya Patel", role: "USER" as const }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        passwordHash: await bcrypt.hash(user.password, 12)
      }
    });
  }

  const rahul = await prisma.user.findUniqueOrThrow({ where: { email: "rahul@demo.com" } });
  await prisma.profile.upsert({
    where: { userId: rahul.id },
    update: {},
    create: {
      userId: rahul.id,
      monthlyIncome: 80000,
      monthlyExpenses: 45000,
      currentSavings: 300000,
      investmentGoal: "MEDIUM_TERM",
      riskAppetite: "MODERATE",
      horizonMonths: 24,
      investableAmount: 168000
    }
  });
  await prisma.portfolio.upsert({
    where: { userId: rahul.id },
    update: {},
    create: { userId: rahul.id, virtualBalance: 168000 }
  });
};

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
