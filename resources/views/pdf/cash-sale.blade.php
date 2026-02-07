<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Cash Sale - {{ $monthName }} {{ $year }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 11pt;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .company-name {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .company-subtitle {
            font-size: 10pt;
            margin-bottom: 15px;
        }

        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .info-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .info-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }

        .income-title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            border: 2px solid #000;
            padding: 8px;
            margin: 20px auto;
            width: 150px;
        }

        .year-month {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }

        .year-section {
            display: table-cell;
            width: 50%;
        }

        .month-section {
            display: table-cell;
            width: 50%;
            text-align: right;
        }

        .amounts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .amounts-table td {
            border: 1px solid #000;
            padding: 10px;
        }

        .amounts-table .label {
            text-align: right;
            font-weight: bold;
            width: 70%;
        }

        .amounts-table .amount {
            text-align: right;
            width: 30%;
        }

        /* ===== Signatures (Fix: add real signature space + avoid splitting) ===== */
        .signatures {
            margin-top: 22mm;
            margin-bottom: 8mm;
            /* bigger signature space */
            page-break-inside: avoid;
            /* keep together */
        }

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 8mm 10px 0 10px;
            /* pushes line down for space */
        }

        .sig-line {
            border-top: 1px solid #000;
            height: 1px;
            margin: 0 auto 4px auto;
            width: 70%;
        }

        .sig-label {
            font-size: 9pt;
        }

        /* ===== Footer (fixed, no overlap because of @page bottom + body padding-bottom) ===== */
        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            text-align: center;
            justify-items: end;
            font-size: 8pt;
            padding: 2mm 0;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="company-name">{{ strtoupper($companyName) }}</div>
    </div>

    <div class="info-section">
        <div class="info-left">
            {{ $companyAddress }}<br>
            {{ $companyPhone }}
        </div>
        <div class="info-right">
            Invoice Date : &nbsp;&nbsp;&nbsp;&nbsp;{{ $printedDate }}<br>
            Vat Reg No : &nbsp;&nbsp;&nbsp;&nbsp;{{ $vatRegNo }}
        </div>
    </div>

    <div class="income-title">INCOME</div>

    <div class="year-month">
        <div class="year-section">
            Year &nbsp;&nbsp;&nbsp;&nbsp;- &nbsp;&nbsp;&nbsp;&nbsp;{{ $year }}
        </div>
        <div class="month-section">
            Month &nbsp;&nbsp;&nbsp;&nbsp;- &nbsp;&nbsp;&nbsp;&nbsp;{{ $monthName }}
        </div>
    </div>

    <table class="amounts-table">
        <tr>
            <td class="label">Total :</td>
            <td class="amount">{{ number_format($totalIncome, 2) }}</td>
        </tr>
        <tr>
            <td class="label">VAT Sale :</td>
            <td class="amount">{{ number_format($vatAmount, 2) }}</td>
        </tr>
        <tr>
            <td class="label">Cash Sale :</td>
            <td class="amount">{{ number_format($cashSale, 2) }}</td>
        </tr>
    </table>

    <!-- FOOTER -->
    <div class="footer">

        <!-- SIGNATURES -->
        <div class="signatures">
            <table class="sig-table">
                <tr>
                    <td class="sig-cell">
                        <div class="sig-line"></div>
                        <div class="sig-label">Customer</div>
                    </td>
                    <td class="sig-cell">
                        <div class="sig-line"></div>
                        <div class="sig-label">Prepared by</div>
                    </td>
                    <td class="sig-cell">
                        <div class="sig-line"></div>
                        <div class="sig-label">Authorised by</div>
                    </td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 12px; font-size: 12px">Powered By:</div>
        <div style="font-size: 11px">DE CREATIONS<sup>&reg;</sup> | 070 300 4483 |
            decreations.lk</div>
    </div>
</body>

</html>
