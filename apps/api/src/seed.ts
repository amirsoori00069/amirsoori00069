/** Seed content from reference HTML (tahlil.html) — Jamali hotel ecosystem sections. */

export type SeedItem = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type SeedSection = {
  id: string;
  title: string;
  sortOrder: number;
  items: SeedItem[];
};

export const SEED_SECTIONS: SeedSection[] = [
  {
    id: "sec1",
    title: "۱. کارهای عمومی و پذیرش (Check-in)",
    sortOrder: 1,
    items: [
      {
        id: "item1_1",
        title: "ثبت اطلاعات هویتی مسافر",
        description:
          "نام، نام خانوادگی، نام پدر، کد ملی، شماره شناسنامه، تاریخ تولد، ملیت و شماره پاسپورت برای اتباع خارجی.",
        sortOrder: 1,
      },
      {
        id: "item1_2",
        title: "اطلاعات اقامت و مالی اولیه",
        description:
          "تاریخ ورود و خروج، تعداد نفرات، نوع خدمات (آزاد، فول‌بورد، هاف‌بورد با صبحانه)، توافق قیمت و مبالغ دریافتی صندوق.",
        sortOrder: 2,
      },
      {
        id: "item1_3",
        title: "یکپارچگی با سیستم اماکن",
        description:
          "ارسال خودکار و آنی اطلاعات به وب‌سرویس‌های اماکن و نیروی انتظامی.",
        sortOrder: 3,
      },
    ],
  },
  {
    id: "sec2",
    title: "۲. زیرسیستم‌های مالی و صندوق",
    sortOrder: 2,
    items: [
      {
        id: "item2_1",
        title: "دسترسی‌های امن مدیران و حسابداران",
        description:
          "تفکیک دسترسی به صندوق، حقوق و دستمزد، و گزارش‌های درآمدی هر بخش.",
        sortOrder: 1,
      },
      {
        id: "item2_2",
        title: "ثبت آنی هزینه‌های جانبی",
        description:
          "ارتباط اتوماتیک کافی‌شاپ، رستوران، لاندری و شارژ یخچال اتاق با حساب نهایی مسافر.",
        sortOrder: 2,
      },
    ],
  },
  {
    id: "sec3",
    title: "۳. اکوسیستم نرم‌افزار موبایل مسافر",
    sortOrder: 3,
    items: [
      {
        id: "item3_1",
        title: "پنل اختصاصی مسافر",
        description:
          "فعال‌سازی خودکار اپلیکیشن روی موبایل مسافر به محض پذیرش در هتل.",
        sortOrder: 1,
      },
      {
        id: "item3_2",
        title: "خدمات رفاهی و گردشگری",
        description:
          "درخواست آنلاین آب‌جوش، تاکسی وی‌آی‌پی، رنت خودرو/موتور، تورهای گردشگری و خرید بلیط.",
        sortOrder: 2,
      },
    ],
  },
  {
    id: "sec4",
    title: "۴. پنل راهنمایان و آژانس‌ها (راهنمای ظاهر)",
    sortOrder: 4,
    items: [
      {
        id: "item4_1",
        title: "رابط کاربری ساده و آکادمیک",
        description:
          "طراحی بسیار ساده برای راهنمایان تور و آژانس‌ها جهت بررسی اتاق‌های خالی و ثبت رزرو.",
        sortOrder: 1,
      },
      {
        id: "item4_2",
        title: "سیستم پورسانت و وفاداری",
        description: "محاسبه خودکار پاداش و پورسانت معرفی مسافر به هتل.",
        sortOrder: 2,
      },
    ],
  },
  {
    id: "sec5",
    title: "۵. انبارداری و تأسیسات",
    sortOrder: 5,
    items: [
      {
        id: "item5_1",
        title: "انبار مرکزی و مصرفی",
        description:
          "مدیریت تجهیزات گران‌قیمت و قطعات تأسیساتی (پمپ، مبدل و...).",
        sortOrder: 1,
      },
      {
        id: "item5_2",
        title: "فرمولاسیون رستوران و کافی‌شاپ",
        description:
          "کسر دقیق مواد اولیه و گوشت مصرفی بر اساس تعداد پرس‌های فروخته شده.",
        sortOrder: 2,
      },
    ],
  },
  {
    id: "sec6",
    title: "۶. ویژگی‌های فنی و زیرساختی",
    sortOrder: 6,
    items: [
      {
        id: "item6_1",
        title: "پشتیبانی از چند زبان",
        description:
          "رابط کاربری دوزبانه (فارسی/عربی/انگلیسی) با قابلیت ترجمه لحظه‌ای.",
        sortOrder: 1,
      },
      {
        id: "item6_2",
        title: "پلتفرم‌های اجرایی",
        description:
          "سازگاری کامل با وب، دسکتاپ و اپلیکیشن موبایل (Android & iOS).",
        sortOrder: 2,
      },
    ],
  },
];
