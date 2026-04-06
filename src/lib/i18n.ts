const strings = {
  ar: {
    // Login
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signInToAccount: 'قم بتسجيل الدخول إلى حساب التاجر',

    // Branches
    selectBranch: 'اختر الفرع',
    changeBranch: 'تغيير الفرع',
    deviceName: 'اسم الجهاز',
    branches: 'الفروع',
    refresh: 'تحديث',
    refreshing: 'جاري التحديث...',
    continue: 'متابعة',
    selectBranchError: 'يرجى اختيار فرع',
    enterDeviceName: 'يرجى إدخال اسم الجهاز',

    // Dashboard
    scanToCount: 'امسح لاحتساب زيارتك',
    generateNewQr: 'توليد رمز QR جديد',
    retry: 'إعادة المحاولة',
    orderFailed: 'فشل في إنشاء الطلب. اضغط أدناه لإعادة المحاولة.',
    orUsePhone: 'أو استخدم رقم الهاتف',
    qrCode: 'رمز QR',
    coupon: 'كوبون',
    confirmOrder: 'تأكيد الطلب',
    orderReceived: 'تم استلام طلب. يرجى التأكيد للمتابعة.',
    confirm: 'تأكيد',
    send: 'إرسال',
    useCoupon: 'استخدام الكوبون',
    enterCouponNumber: 'أدخل رقم الكوبون',

    // Casher
    phoneNumber: 'رقم الهاتف',
    waitingForOrders: 'في انتظار الطلبات...',
    orderReceivedWaiting: 'تم استلام الطلب - في انتظار العميل',
    receiptPosted: 'تم إرسال الإيصال',

    // Add Total
    addTotal: 'إضافة المبلغ',
    orderNumber: 'رقم الطلب',
    receiptTotal: 'إجمالي الإيصال (ريال)',
    done: 'تم',
    receiptSuccess: 'تم إرسال الإيصال بنجاح',

    // Coupon
    couponDetails: 'تفاصيل الكوبون',
    couponId: 'رقم الكوبون',
    couponName: 'الاسم',
    title: 'العنوان',
    description: 'الوصف',
    oldPrice: 'السعر القديم',
    newPrice: 'السعر الجديد',
    accept: 'قبول',
    confirmUseCoupon: 'هل أنت متأكد من استخدام هذا الكوبون؟',
    cancel: 'إلغاء',
    couponUsed: 'تم استخدام الكوبون بنجاح',
    couponNotFound: 'الكوبون غير موجود',

    // Settings
    settings: 'الإعدادات',
    changeMerchantBackground: 'تغيير صورة خلفية التاجر',
    logout: 'تسجيل الخروج',
    selectImage: 'اختر صورة',
    noImageSelected: 'لم يتم اختيار صورة',
    imageSaved: 'تم حفظ الصورة بنجاح',

    // Common
    ok: 'موافق',
    save: 'حفظ',
    back: 'رجوع',
    loading: 'جاري التحميل...',
    pleaseWait: 'يرجى الانتظار...',
    somethingWentWrong: 'حدث خطأ ما',
    tryAgain: 'حاول مرة أخرى',
    welcome: 'مرحبا',

    // Branches page
    setupDevice: 'إعداد جهازك',
    setupDeviceDesc: 'اختر فرعاً وسمِّ هذا الجهاز للبدء.',
    deviceNamePlaceholder: 'مثال: آيباد-الكاونتر-1',
    selectedBranch: 'الفرع المحدد',
    locationsAvailable: 'فرع متاح',
    noBranches: 'لم يتم العثور على فروع',
    noBranchesDesc: 'تواصل مع المسؤول لإعداد الفروع.',
    merchantPortal: 'بوابة التاجر',
    welcomeBack: 'مرحباً بعودتك',
    enterYourEmail: 'أدخل بريدك الإلكتروني',
    enterYourPassword: 'أدخل كلمة المرور',
    couponMode: 'وضع الكوبون',
    couponModeDesc: 'أدخل رمز الكوبون في الشريط الجانبي',
    orderDetails: 'تفاصيل الطلب',
    enterOrderNumber: 'أدخل رقم الطلب',
    ordersFromPos: 'ستظهر الطلبات من نقطة البيع هنا تلقائياً',
    useCouponConfirm: 'لا يمكن التراجع عن هذا الإجراء. سيتم تحديد الكوبون كمستخدم.',
    acceptCoupon: 'قبول الكوبون',
    tapToSelectImage: 'اضغط لاختيار صورة',
    merchantBackground: 'خلفية التاجر',
    apply: 'تطبيق',
    noActiveOrder: 'لا يوجد طلب نشط',
    invalidCoupon: 'كوبون غير صالح',
    failedToPost: 'فشل في الإرسال',
    orderReceivedConfirm: 'تم استلام طلب جديد. أكد للمتابعة.',

    // Validation
    checkEmail: 'تحقق من البريد الإلكتروني',
    checkPassword: 'تحقق من كلمة المرور',
    checkPhone: 'تحقق من رقم الهاتف',
  },

  en: {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signInToAccount: 'Sign in to your merchant account',

    selectBranch: 'Select Branch',
    changeBranch: 'Change Branch',
    deviceName: 'Device Name',
    branches: 'Branches',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    continue: 'Continue',
    selectBranchError: 'Please select a branch',
    enterDeviceName: 'Please enter a device name',

    scanToCount: 'Scan to count your visit',
    generateNewQr: 'Generate new QR',
    retry: 'Retry',
    orderFailed: 'Failed to create order. Tap below to retry.',
    orUsePhone: 'Or use phone number',
    qrCode: 'QR Code',
    coupon: 'Coupon',
    confirmOrder: 'Confirm Order',
    orderReceived: 'An order has been received. Please confirm to proceed.',
    confirm: 'Confirm',
    send: 'Send',
    useCoupon: 'Use Coupon',
    enterCouponNumber: 'Enter coupon number',

    phoneNumber: 'Phone Number',
    waitingForOrders: 'Waiting for orders...',
    orderReceivedWaiting: 'Order received - waiting for customer',
    receiptPosted: 'Receipt posted',

    addTotal: 'Add Total',
    orderNumber: 'Order Number',
    receiptTotal: 'Receipt Total (SAR)',
    done: 'Done',
    receiptSuccess: 'Receipt posted successfully',

    couponDetails: 'Coupon Details',
    couponId: 'Coupon ID',
    couponName: 'Name',
    title: 'Title',
    description: 'Description',
    oldPrice: 'Old Price',
    newPrice: 'New Price',
    accept: 'Accept',
    confirmUseCoupon: 'Are you sure you want to use this coupon?',
    cancel: 'Cancel',
    couponUsed: 'Coupon used successfully',
    couponNotFound: 'Coupon not found',

    settings: 'Settings',
    changeMerchantBackground: 'Change Merchant Background',
    logout: 'Logout',
    selectImage: 'Select Image',
    noImageSelected: 'No image selected',
    imageSaved: 'Image saved successfully',

    ok: 'OK',
    save: 'Save',
    back: 'Back',
    loading: 'Loading...',
    pleaseWait: 'Please wait...',
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try again',
    welcome: 'Welcome to',

    setupDevice: 'Setup your device',
    setupDeviceDesc: 'Choose a branch and name this device to get started.',
    deviceNamePlaceholder: 'e.g. iPad-Counter-1',
    selectedBranch: 'Selected Branch',
    locationsAvailable: 'locations available',
    noBranches: 'No branches found',
    noBranchesDesc: 'Contact your administrator to set up branches.',
    merchantPortal: 'Merchant Portal',
    welcomeBack: 'Welcome back',
    enterYourEmail: 'you@example.com',
    enterYourPassword: 'Enter your password',
    couponMode: 'Coupon Mode',
    couponModeDesc: 'Enter a coupon code in the sidebar',
    orderDetails: 'Order Details',
    enterOrderNumber: 'Enter order number',
    ordersFromPos: 'Orders from your POS will appear here automatically',
    useCouponConfirm: 'This action cannot be undone. The coupon will be marked as used.',
    acceptCoupon: 'Accept Coupon',
    tapToSelectImage: 'Tap to select image',
    merchantBackground: 'Merchant Background',
    apply: 'Apply',
    noActiveOrder: 'No active order',
    invalidCoupon: 'Invalid coupon',
    failedToPost: 'Failed to post',
    orderReceivedConfirm: 'A new order has arrived. Confirm to proceed with processing.',

    checkEmail: 'Check email',
    checkPassword: 'Check password',
    checkPhone: 'Check phone number',
  },
} as const;

export type Locale = keyof typeof strings;
export type TranslationKey = keyof typeof strings['en'];

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bonat_locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('bonat_locale') as Locale | null;
    if (stored && strings[stored]) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function t(key: TranslationKey): string {
  return strings[getLocale()][key] || strings['en'][key] || key;
}
