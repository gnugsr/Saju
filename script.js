document.addEventListener('DOMContentLoaded', () => {

    // --- Constants & Data ---

    const stems = ["갑(甲)", "을(乙)", "병(丙)", "정(丁)", "무(戊)", "기(己)", "경(庚)", "신(辛)", "임(壬)", "계(癸)"];
    const branches = ["자(子)", "축(丑)", "인(寅)", "묘(卯)", "진(辰)", "사(巳)", "오(午)", "미(未)", "신(申)", "유(酉)", "술(戌)", "해(亥)"];

    // 60 Gan-Ji characters combined
    function getGanJi(stemIdx, branchIdx) {
        return {
            gan: stems[stemIdx % 10],
            ji: branches[branchIdx % 12]
        };
    }

    // --- Saju Logic / Calculations ---

    /**
     * Calculate Year Pillar (Se-Cha)
     * Year Stem: (Year - 4) % 10
     * Year Branch: (Year - 4) % 12
     */
    function getYearPillar(year) {
        // 1984 is 甲子 (Gapja) year. 
        // We can simply use (year - 4) algorithm for standard Gregorian years > 4 AD.
        let stemIdx = (year - 4) % 10;
        let branchIdx = (year - 4) % 12;

        // Handle negative (BC) if needed, but assuming AD for this form
        if (stemIdx < 0) stemIdx += 10;
        if (branchIdx < 0) branchIdx += 12;

        return getGanJi(stemIdx, branchIdx);
    }

    /**
     * Calculate Month Pillar (Wol-Cha)
     * Month Pillar depends on the Year Stem and the Month.
     * Simple formula:
     * Year Stem Index (0-9) -> Multiplier
     * Month Stem Index = (YearStemIdx * 2 + MonthIdx) % 10
     * Month Branch is generally fixed to the month (approx):
     * Feb=寅(2), Mar=卯(3) ... Jan=丑(1).
     * 
     * NOTE: Strictly speaking, Saju months switch on Solar Terms (Jeolgi), usually around 4th-8th.
     * We will use a simplified approximation: switching on the 4th of the month.
     */
    function getMonthPillar(year, month, day) {
        // Adjust month based on Solar Term approximation (Day < 4 means previous month)
        // Saju New Year starts on Li Chun (approx Feb 4).
        // For simplicity in this logic:
        // We treat Feb as the 1st month (Tiger), Jan as the 12th month (Ox) of previous year context if before Feb 4.

        let adjustedMonth = month;
        let adjustedYear = year;

        // Simple cut-off: 4th of the month.
        if (day < 4) {
            adjustedMonth -= 1;
            if (adjustedMonth < 1) {
                adjustedMonth = 12;
                adjustedYear -= 1;
            }
        }

        // Map Gregorian Month to Saju Branch Index
        // distinct mapping: Feb -> In(2), Mar -> Mao(3)... 
        // Jan -> Chou(1)
        // Logic: (Month + 1) % 12 gives the branch index roughly?
        // Feb(2) -> In(2) -> index 2 relative to Zi(0)? No.
        // Sequence: Zi(0), Chou(1), Yin(2), Mao(3)...
        // Feb is Yin(2).
        // Formula: (GregorianMonth) % 12 ? 
        // Feb(2) -> 2. Jan(1) -> 1. Dec(12) -> 0(Zi). 
        // Wait, standard is: Month 11(Dec) -> Zi, Month 12(Jan) -> Chou, Month 1(Feb) -> Yin.

        // Let's implement standard mapping based on "Yin" starting month being Feb.
        // Gregorian 2(Feb) -> Yin(2)
        // Gregorian 1(Jan) -> Chou(1)
        // Gregorian 12(Dec) -> Zi(0)
        // Formula: simple mapping
        const monthBranchMap = [
            1, // Jan -> Chou
            2, // Feb -> Yin
            3, // Mar -> Mao
            4, // Apr -> Chen
            5, // May -> Si
            6, // Jun -> Wu
            7, // Jul -> Wei
            8, // Aug -> Shen
            9, // Sep -> You
            10, // Oct -> Xu
            11, // Nov -> Hai
            0 // Dec -> Zi
        ];

        let branchIdx = monthBranchMap[adjustedMonth - 1]; // 0-indexed array

        // Calculate Stem
        // "Year Stem governs Month Stem" (Wol-Du-Beop)
        // Formula: (YearStemIdx % 5) * 2 + 2 + (BranchOffset) ?
        // Simplified lookup:
        // Jia/Ji years (0,5): Feb is Bing-Yin (2) -> Stem 2.
        // Yi/Geng years (1,6): Feb is Wu-Yin (4).
        // Bing/Xin years (2,7): Feb is Geng-Yin (6).
        // Ding/Ren years (3,8): Feb is Ren-Yin (8).
        // Wu/Gui years (4,9): Feb is Jia-Yin (0).

        // Let's deduce the offset for the first month (Feb/Yin).
        let yearStemIdx = (adjustedYear - 4) % 10;
        if (yearStemIdx < 0) yearStemIdx += 10;

        let startStemIdx = ((yearStemIdx % 5) * 2 + 2) % 10;

        // Distance from Yin(2) to current branchIdx
        // The sequence of branches is fixed: Yin, Mao, Chen...
        // We need to count how many months passed since Yin.
        // Yin(2) is index 0 in the sequence of the year?
        // Let's normalize offset.
        // If branch is Yin(2), offset is 0.
        // If branch is Mao(3), offset is 1.
        // ...
        // If branch is Chou(1), offset is 11.

        let monthOffset = (branchIdx - 2 + 12) % 12;
        let stemIdx = (startStemIdx + monthOffset) % 10;

        return getGanJi(stemIdx, branchIdx);
    }

    /**
     * Calculate Day Pillar (Il-Ju)
     * Requires counting days from a reference date.
     * Ref Date: Jan 1, 1900 was a Jia-Xu (Gap-Sul) day?
     * Checking external source: Jan 1, 1900 was actually a Monday.
     * Let's use a known recent date for easier validation or calculate properly.
     * 
     * Reference: Oct 15, 1582 (Gregorian start) or recent.
     * Let's use Base Date: Jan 1, 1900.
     * Julian Day Number is best, but let's do a day count loop or simple math.
     * Unix Epoch: Jan 1 1970.
     * Jan 1 1970 was a Thursday.
     * Let's check the Gan-Ji for Jan 1 1970.
     * 1970 Jan 1 is 己卯 (Ji-Mao)? No let's calculate back/verify.
     * 
     * Easier reference: Nov 21, 2023 was a Geng-Shen(56) day? No.
     * Reference: Jan 1, 2000 was Saturday.
     * Jan 1, 2000 Gan-Ji: 戊午 (Wu-Wu, 54).
     */
    function getDayPillar(year, month, day) {
        const baseDate = new Date(2000, 0, 1); // Month is 0-indexed -> Jan 1, 2000
        const targetDate = new Date(year, month - 1, day);

        // Difference in days
        const diffTime = targetDate.getTime() - baseDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Base GanJi index for Jan 1, 2000 is Wu-Wu (Stem 4, Branch 6).
        // Wu(4) - Wu(6). This corresponds to number 54 in the 60 cycle (Wait, Jia-Zi is 1).
        // Let's map 0-59.
        // Gan 4, Ji 6. 
        // 60-cycle index = (StemIdx - BranchIdx)/2 * 10 + BranchIdx ? No.
        // Simple iteration or modular arithmetic.

        // Start indices for Jan 1 2000
        const baseStem = 4; // Wu
        const baseBranch = 6; // Wu (Horse)

        let stemIdx = (baseStem + diffDays) % 10;
        let branchIdx = (baseBranch + diffDays) % 12;

        if (stemIdx < 0) stemIdx += 10;
        if (branchIdx < 0) branchIdx += 12;

        return getGanJi(stemIdx, branchIdx);
    }

    /**
     * Calculate Hour Pillar (Si-Ju)
     * Depends on Day Stem and Hour Branch.
     */
    function getHourPillar(dayStemName, hour) {
        // Find Day Stem Index from the string
        let dayStemIdx = stems.findIndex(s => s === dayStemName);

        // Determine Hour Branch
        // Zi: 23:00 - 01:00
        // Chou: 01:00 - 03:00
        // ...
        // Formula: (Hour + 1) / 2
        let branchIdx = Math.floor((parseInt(hour) + 1) / 2) % 12;

        // Si-Du-Beop (Day Stem governs Hour Stem)
        // Jia/Ji Days (0,5) -> Start with Jia-Zi (0)
        // Yi/Geng Days (1,6) -> Start with Bing-Zi (2)
        // Bing/Xin Days (2,7) -> Start with Wu-Zi (4)
        // Ding/Ren Days (3,8) -> Start with Geng-Zi (6)
        // Wu/Gui Days (4,9) -> Start with Ren-Zi (8)

        let startStemIdx = (dayStemIdx % 5) * 2;
        let stemIdx = (startStemIdx + branchIdx) % 10;

        return getGanJi(stemIdx, branchIdx);
    }


    // --- UI/Interaction ---

    const form = document.getElementById('sajuForm');
    const resultSection = document.getElementById('resultSection');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const birthDate = document.getElementById('birthDate').value;
        const birthTime = document.getElementById('birthTime').value;
        // const gender = document.getElementById('gender').value; // Not used in basic pillar calc

        if (!birthDate || !birthTime) return;

        const [year, month, day] = birthDate.split('-').map(Number);
        const [hour, minute] = birthTime.split(':').map(Number);

        // User requested limit: 1926 ~ 2026
        if (year < 1926 || year > 2026) {
            alert("연도는 1926년에서 2026년 사이로 입력해주세요.");
            return;
        }

        const isLunar = document.getElementById('isLunar').checked;

        // Convert to Solar if Lunar checked
        if (isLunar) {
            try {
                const calendar = new KoreanLunarCalendar();
                // Assuming isLeapMonth is false for simple toggle. 
                // To support leap months properly, we'd need another UI input.
                // For now, defaulting to non-leap month.
                calendar.setLunar(year, month, day, false);

                const solar = calendar.getSolar();

                // Override the year/month/day with the converted solar date
                // Solar object returns: { year: 2023, month: 1, day: 22, ... }
                // We need to update our variables.

                // Note: Const reassignment is not allowed. 
                // We should change the initial declaration to let or create new vars.
            } catch (e) {
                console.error("Lunar conversion failed:", e);
                alert("음력 변환에 실패했습니다. 날짜를 확인해주세요.");
                return;
            }
        }

        // Let's refactor the variable declaration above to support this cleanly.
        // We will do it in a cleaner way by creating 'targetYear', 'targetMonth', 'targetDay'.

        let targetYear = year;
        let targetMonth = month;
        let targetDay = day;

        if (isLunar) {
            const calendar = new KoreanLunarCalendar();
            calendar.setLunar(year, month, day, false);

            const solar = calendar.getSolar();
            targetYear = solar.year;
            targetMonth = solar.month;
            targetDay = solar.day;

            console.log(`Lunar ${year}-${month}-${day} converted to Solar ${targetYear}-${targetMonth}-${targetDay}`);
        }

        // Calculate Pillars using Target (Solar) Date
        const yearPillar = getYearPillar(targetYear); // Preliminary

        // Saju Year Adjustment (Feb 4th approx)
        let sajuYear = targetYear;
        if (targetMonth < 2 || (targetMonth === 2 && targetDay < 4)) {
            sajuYear = targetYear - 1;
        }

        const refinedYearPillar = getYearPillar(sajuYear);

        const monthPillar = getMonthPillar(targetYear, targetMonth, targetDay);
        const dayPillar = getDayPillar(targetYear, targetMonth, targetDay);
        const hourPillar = getHourPillar(dayPillar.gan, hour);

        // Display Results
        updatePillarUI('year', refinedYearPillar);
        updatePillarUI('month', monthPillar);
        updatePillarUI('day', dayPillar);
        updatePillarUI('hour', hourPillar);

        // Generate Analysis Text (Simple Mock)
        const analysis = generateAnalysis(refinedYearPillar, monthPillar, dayPillar, hourPillar);
        document.getElementById('analysisText').innerHTML = analysis;

        // Show Result
        form.closest('.card').classList.add('hidden'); // Hide form
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in-up');
    });

    resetBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        resultSection.classList.remove('fade-in-up');
        form.closest('.card').classList.remove('hidden');
        form.closest('.card').classList.add('fade-in');
        form.reset();
    });

    function updatePillarUI(type, pillar) {
        // Strip the Chinese char for checking, or keep it.
        // pillar.gan is like "갑(甲)"
        // We want to color them or style them.

        // Extract just the Chinese or Korean? Stick to Full string for now.
        // Let's split for better styling if needed.
        const ganElem = document.getElementById(`${type}Gan`);
        const jiElem = document.getElementById(`${type}Ji`);

        ganElem.textContent = pillar.gan;
        jiElem.textContent = pillar.ji;
    }

    function generateAnalysis(year, month, day, hour) {
        // Simple random 'fortune' based on Day Master (Day Stem)
        const dayMaster = day.gan.charAt(0); // '갑', '을' ...

        const qualities = {
            '갑': '대나무처럼 곧고 강한 의지를 가졌습니다. 리더십이 뛰어나며 성장을 지향합니다.',
            '을': '유연하고 적응력이 뛰어납니다. 끈기가 있어 환경에 잘 대처합니다.',
            '병': '태양처럼 밝고 정열적입니다. 모든 이를 비추는 화려함이 있습니다.',
            '정': '촛불처럼 온화하고 희생적인 면모가 있습니다. 섬세한 감성의 소유자입니다.',
            '무': '태산처럼 묵직하고 신뢰감을 줍니다. 포용력이 넓습니다.',
            '기': '비옥한 밭처럼 실속이 있고 다재다능합니다. 자기 표현이 확실합니다.',
            '경': '다듬어지지 않은 원석이나 도끼처럼 결단력이 강하고 의리가 있습니다.',
            '신': '보석처럼 예리하고 깔끔합니다. 자존심이 강하고 섬세합니다.',
            '임': '바다처럼 유유하고 지혜롭습니다. 생각이 깊고 유연합니다.',
            '계': '시냇물처럼 맑고 총명합니다. 기획력과 아이디어가 뛰어납니다.'
        };

        let text = `<p><strong>본원(일간): ${day.gan}</strong></p>`;
        text += `<p>${qualities[dayMaster] || '신비로운 기운이 감도는 사주입니다.'}</p>`;
        text += `<br><p>새해에는 당신의 ${day.ji} 날의 기운이 ${year.gan}의 해를 만나 새로운 조화를 이룰 것입니다.</p>`;

        return text;
    }

});
