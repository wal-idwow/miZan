// miZan — Moroccan Darija UI Copy (Single Source of Truth)
// All UI strings centralized here for clean v2 localization (AR, FR, EN)

export const darija = {
  // App identity
  app: {
    name: 'miZan — ميزان',
    tagline: 'تحكم ففلوسك، وشوف لقدام',
  },

  // Navigation / Top bar
  nav: {
    quickCheckin: 'تحديث سريع',
    vision: 'شوف لقدام',
    whatIf: 'جرّب سيناريو',
    items: 'أهداف وديون',
    bills: 'المصاريف القارة',
    buckets: 'مصروف متغير',
    export: 'تصدير JSON',
    import: 'استيراد JSON',
    loadDemo: 'حمّل سيناريو تجريبي',
    resetWhatIf: 'مسح السيناريو',
    applyWhatIf: 'تطبيق السيناريو',
  },

  // Quick Check-in Modal/Drawer
  checkin: {
    title: 'تحديث سريع',
    subtitle: 'عدّل أرقامك الأساسية في ثواني',
    currentBalance: 'الرصيد الحقيقي الآن',
    currentBalanceHint: 'كم عندك كاش + بنك هاد اللحظة؟',
    fixedSalary: 'الصالير الثابت',
    fixedSalaryHint: 'المرتب اللي داخل كل شهر',
    sideIncome: 'مدخول إضافي',
    sideIncomeHint: 'دخول غير قارة (فريلانس، كراء، إلخ) — معدل شهري',
    save: 'حفظ',
    cancel: 'إلغاء',
    savedToast: 'تم الحفظ، التوقعات حدّثات',
  },

  // 4/8/12 Month Vision Cards
  vision: {
    title: 'شوف لقدام: 4 / 8 / 12 شهر',
    subtitle: 'توقع رصيدك في المحطات الرئيسية',
    month4: 'شهر 4',
    month8: 'شهر 8',
    month12: 'شهر 12',
    projectedBalance: 'الرصيد المتوقع',
    status: {
      surplus: 'فائض ✅',
      deficit: 'عجز ⚠️',
      breakEven: 'متوازن ➖',
    },
    keyDriversLabel: 'العوامل الرئيسية',
    timelineTitle: 'الخط الزمني 12 شهر',
    timelineAriaLabel: 'مخطط شريطي لتطور الرصيد على 12 شهر',
    noData: 'ما فيهش بيانات — ضيف رصيدك والصالير باش تبدا',
  },

  // What-If Simulator
  whatIf: {
    title: 'جرّب سيناريو (What-If)',
    subtitle: 'اختبر تغييرات مؤقتة وشوف تأثيرها فوراً — ما يتحفظش إلا إذا ضغّيت "تطبيق"',
    extraSaving: 'توفير إضافي شهري',
    extraSavingHint: 'مثال: +500 درهم/شهر تدخرهم',
    extraExpense: 'مصروف/مخاطرة إضافي',
    extraExpenseHint: 'مثال: 3000 درهم طارئة أو مخطط ليها',
    variableCut: 'تقليص المصاريف المتغيرة',
    variableCutHint: 'نسبة مئوية، مثال: 10% = أقل 10% على السكن/النقل/الترفيه',
    livePreview: 'معاينة مباشرة',
    reset: 'مسح الكل',
    apply: 'تطبيق على البيانات الحقيقية',
    appliedToast: 'السيناريو تم تطبيحه على بياناتك',
    resetToast: 'السيناريو تم مساحو، رجعت للأصل',
    impactOn: 'التأثير على:',
    month4Impact: 'شهر 4',
    month8Impact: 'شهر 8',
    month12Impact: 'شهر 12',
    goalsImpact: 'إتمام الأهداف',
  },

  // Goals, Shocks & Debts List
  items: {
    title: 'أهداف وديون',
    subtitle: 'كل هدف/دين/مصروف جاي عليه شريط تقدم: الأخضر = مدفوع/مدخر، الأحمر = باقي',
    addButton: '➕ ضيف هدف / دين / مصروف جاي',
    emptyState: 'ما عندكش أهداف ولا ديون بعد. ضيف أول وحدة!',
    categories: {
      goal: 'هدف 🎯',
      shock: 'مصاريف جاية ⚡',
      debt: 'دين 💳',
    },
    form: {
      title: 'ضيف عنصر جديد',
      editTitle: 'عدّل العنصر',
      name: 'الاسم',
      namePlaceholder: 'مثال: كراء العيد، سداد القرض، رحلة الصيف',
      category: 'النوع',
      totalAmount: 'المبلغ الكلي (درهم)',
      alreadySaved: 'مبلغ مدفوع/مدخر لحد الساعة (درهم)',
      targetMonth: 'الشهر المستهدف (1-12+)',
      targetMonthHint: '1 = الشهر الجاي، 12 = بعد 12 شهر، 13+ = بعد الأفق',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      deleteConfirm: 'تأكد تحذف هاد العنصر؟ ما يمكنش ترجعو.',
    },
    progress: {
      saved: 'مدخر/مدفوع',
      remaining: 'باقي',
      monthlySlice: 'الحصة الشهرية',
      monthsLeft: 'شهر باقي',
      completed: 'مكتمل! ✅',
      overdue: 'متأخر ⚠️',
      addPayment: '➕ ضيف دفع/توفير',
      addPaymentHint: 'زيادة المبلغ المدفوع/المدخر وتحديث الشريط',
    },
  },

  // Fixed Bills
  bills: {
    title: 'المصاريف القارة (ثابتة كل شهر)',
    subtitle: 'تعديلاتك هنا تؤثر مباشرة على التدفق الحر',
    rent: 'الكراء',
    utilities: 'الماء / الكهرباء / الإنترنت',
    subscriptions: 'الاشتراكات (جيم، نتفليكس، إلخ)',
    other: 'أخرى',
    total: 'المجموع الشهري',
    edit: 'عدّل',
    save: 'حفظ',
  },

  // Variable Buckets
  buckets: {
    title: 'مصروف متغير (سقوف شهرية)',
    subtitle: 'ما كنديرش تتبع يومي — غير سقف شهري لكل فئة',
    groceries: 'السوق / الأكل',
    transport: 'النقل / البنزين',
    leisure: 'الخروج / الترفيه',
    other: 'أخرى',
    total: 'المجموع الشهري',
    edit: 'عدّل',
    save: 'حفظ',
  },

  // Data Persistence
  data: {
    exportTitle: 'تصدير بياناتك',
    exportDesc: 'حمل ملف JSON فيه كلشي: رصيد، صالير، أهداف، سيناريوهات...',
    exportButton: '⬇️ حمل النسخة الاحتياطية',
    importTitle: 'استيراد نسخة احتياطية',
    importDesc: 'اختر ملف JSON سبق تصديرو لاسترجاع بياناتك',
    importButton: '📁 اختر ملف',
    importSuccess: 'البيانات استوردات بنجاح!',
    importError: 'خطأ: الملف ما بصحش أو phiênة قديمة',
    demoTitle: 'سيناريو موظف تجريبي',
    demoDesc: 'حمل بيانات واقعية باش تجرب التطبيق فوراً',
    demoButton: '🎬 حمّل السيناريو التجريبي',
    demoLoaded: 'السيناريو التجريبي تم تحميلو!',
    clearAll: 'مسح كلشي (خطر!)',
    clearConfirm: 'تأكد تمسح كل البيانات؟ هاد لا يمكن تراجعو.',
  },

  // Common / Shared
  common: {
    currency: 'درهم',
    currencyShort: 'DH',
    month: 'شهر',
    months: 'أشهر',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    close: 'سد',
    loading: 'كايتحمل...',
    error: 'وقع خطأ',
    success: 'تم بنجاح',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    yes: 'إيه',
    no: 'لا',
    or: 'أو',
    and: 'و',
    of: 'من',
    to: 'إلى',
    from: 'من',
    perMonth: '/شهر',
    percent: '%',
    dh: 'درهم',
  },

  // Accessibility / ARIA
  a11y: {
    closeModal: 'سد النافذة',
    openMenu: 'فتح القائمة',
    increaseValue: 'زيادة القيمة',
    decreaseValue: 'نقصان القيمة',
    progressBar: 'شريط التقدم، {percent} في المئة مكتمل',
    milestoneCard: 'بطاقة محطة شهر {month}: رصيد متوقع {balance} درهم، {status}',
    whatIfInput: 'مدخل السيناريو: {label}، القيمة الحالية {value}',
    itemProgress: 'عنصر {name}: {saved} درهم مدخر من {total} درهم، {percent} في المئة',
  },
} as const;

export type DarijaKeys = typeof darija;