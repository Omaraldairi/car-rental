/* =========================================================
   myFunctions.js - جميع توابع جافاسكريبت للموقع
   ========================================================= */

var DAY_MS = 24 * 60 * 60 * 1000;

/* تحويل نص بصيغة dd-mm-yyyy إلى كائن Date، أو null إن كان غير صحيح */
function parseDate(text) {
  var match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (!match) { return null; }
  var day = parseInt(match[1], 10);
  var month = parseInt(match[2], 10) - 1;
  var year = parseInt(match[3], 10);
  var d = new Date(year, month, day);
  // التأكد من أن التاريخ حقيقي (مثلاً رفض 31-02-2026)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) { return null; }
  return d;
}

function setError(id, message) {
  document.getElementById(id + "Err").innerHTML = message;
  return message === "";
}

/* توابع التحقق: كل تابع يعيد true إذا كانت القيمة صحيحة */
function validateName(value) {
  if (value === "") { return setError("fullName", ""); }            // حقل اختياري
  if (!/^[ء-ي\s]+$/.test(value)) {
    return setError("fullName", "الاسم يجب أن يحتوي على أحرف عربية فقط");
  }
  return setError("fullName", "");
}

function validateNationalId(value) {
  if (value === "") { return setError("nationalId", "الرقم الوطني إلزامي"); }
  if (!/^\d{11}$/.test(value)) { return setError("nationalId", "الرقم الوطني يجب أن يتكون من 11 رقماً"); }
  var province = parseInt(value.substring(0, 2), 10);
  if (province < 1 || province > 14) {
    return setError("nationalId", "أول خانتين يجب أن تكونا رمز محافظة بين 01 و 14");
  }
  return setError("nationalId", "");
}

function validateDates(startText, endText) {
  var ok = true;
  var start = parseDate(startText);
  var end = parseDate(endText);

  if (startText === "") { ok = setError("startDate", "تاريخ البداية إلزامي"); }
  else if (start === null) { ok = setError("startDate", "الصيغة الصحيحة dd-mm-yyyy"); }
  else { setError("startDate", ""); }

  if (endText === "") { ok = setError("endDate", "تاريخ النهاية إلزامي") && ok; }
  else if (end === null) { ok = setError("endDate", "الصيغة الصحيحة dd-mm-yyyy") && ok; }
  else if (start !== null && end <= start) {
    ok = setError("endDate", "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية") && ok;
  }
  else { setError("endDate", ""); }

  return ok;
}

function validateMobile(value) {
  if (value === "") { return setError("mobile", ""); }
  // Syriatel: 093 / 098 / 099 ، MTN: 094 / 095 / 096
  if (!/^09[345689]\d{7}$/.test(value)) {
    return setError("mobile", "رقم غير صحيح (يجب أن يبدأ بـ 093، 094، 095، 096، 098 أو 099 ويتكون من 10 أرقام)");
  }
  return setError("mobile", "");
}

function validateEmail(value) {
  if (value === "") { return setError("email", ""); }
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    return setError("email", "البريد الإلكتروني غير صحيح");
  }
  return setError("email", "");
}

/* حساب عدد الأيام والمبالغ وعرض النتيجة دون إعادة تحميل الصفحة */
function showResult(selected, start, end) {
  var days = Math.round((end - start) / DAY_MS);
  var html = "<h3>تم تسجيل طلب الحجز بنجاح</h3><table class=\"data-table\">" +
             "<tr><th>السيارة</th><th>عدد الأيام</th><th>السعر اليومي</th><th>المبلغ</th></tr>";
  var total = 0;

  for (var i = 0; i < selected.length; i++) {
    var subtotal = selected[i].price * days;
    total += subtotal;
    html += "<tr><td>" + selected[i].model + " (" + selected[i].code + ")</td><td>" + days +
            "</td><td>" + selected[i].price.toLocaleString() + " ل.س</td><td>" +
            subtotal.toLocaleString() + " ل.س</td></tr>";
  }
  html += "</table>";

  var discount = (days > 7) ? total * 0.10 : 0;
  html += "<p>المجموع: " + total.toLocaleString() + " ل.س</p>";
  html += "<p>الخصم: " + (discount > 0 ? "10% = " + discount.toLocaleString() + " ل.س" : "لا يوجد (مدة التأجير 7 أيام أو أقل)") + "</p>";
  html += "<p><strong>المبلغ النهائي: " + (total - discount).toLocaleString() + " ل.س</strong></p>";

  $("#result").html(html).hide().fadeIn(400);
}

function getSelectedCars() {
  var list = [];
  $(".car-select:checked").each(function () {
    list.push({
      code: $(this).val(),
      model: $(this).attr("data-model"),
      price: parseInt($(this).attr("data-price"), 10)
    });
  });
  return list;
}

/* ===== ربط الأحداث باستخدام jQuery ===== */
$(document).ready(function () {

  // إظهار/إخفاء تفاصيل السيارة (يمكن إظهار عدة سيارات معاً)
  $(".details-toggle").on("change", function () {
    var detailsRow = $(this).closest("tr").next(".details-row");
    if ($(this).is(":checked")) { detailsRow.fadeIn(300); }
    else { detailsRow.fadeOut(300); }
  });

  // زر المتابعة يظهر النموذج إذا تم اختيار سيارة واحدة على الأقل
  $("#continueBtn").on("click", function () {
    if (getSelectedCars().length === 0) {
      $("#selectMsg").text("الرجاء اختيار سيارة واحدة على الأقل");
      $("#bookingForm").slideUp(300);
      return;
    }
    $("#selectMsg").text("");
    $("#bookingForm").slideDown(400);
  });

  // التحقق عند الإرسال
  $("#bookingForm").on("submit", function (event) {
    event.preventDefault();

    var nameOk   = validateName($.trim($("#fullName").val()));
    var idOk     = validateNationalId($.trim($("#nationalId").val()));
    var datesOk  = validateDates($.trim($("#startDate").val()), $.trim($("#endDate").val()));
    var mobileOk = validateMobile($.trim($("#mobile").val()));
    var emailOk  = validateEmail($.trim($("#email").val()));

    var selected = getSelectedCars();
    if (selected.length === 0) {
      $("#selectMsg").text("الرجاء اختيار سيارة واحدة على الأقل");
      return;
    }

    if (nameOk && idOk && datesOk && mobileOk && emailOk) {
      showResult(selected, parseDate($.trim($("#startDate").val())), parseDate($.trim($("#endDate").val())));
    } else {
      $("#result").fadeOut(200);
    }
  });

  // مسح النموذج يخفي النتيجة والرسائل
  $("#bookingForm").on("reset", function () {
    $(".error").text("");
    $("#result").fadeOut(200);
  });
});
