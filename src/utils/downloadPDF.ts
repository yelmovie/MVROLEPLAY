import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeneratedScript } from '../app/App';

// 역할별 색상 팔레트
const CHAR_COLORS = [
  { bg: '#DBEAFE', accent: '#3B82F6', text: '#1D4ED8', light: '#EFF6FF' },
  { bg: '#FCE7F3', accent: '#EC4899', text: '#9D174D', light: '#FDF2F8' },
  { bg: '#EDE9FE', accent: '#8B5CF6', text: '#5B21B6', light: '#F5F3FF' },
  { bg: '#D1FAE5', accent: '#10B981', text: '#047857', light: '#ECFDF5' },
  { bg: '#FEF3C7', accent: '#FBBF24', text: '#92400E', light: '#FFFBEB' },
  { bg: '#CFFAFE', accent: '#06B6D4', text: '#0E7490', light: '#ECFEFF' },
  { bg: '#FEE2E2', accent: '#EF4444', text: '#991B1B', light: '#FEF2F2' },
  { bg: '#E0E7FF', accent: '#6366F1', text: '#312E81', light: '#EEF2FF' },
];

function buildPDFHTML(script: GeneratedScript): string {
  const colorMap = new Map<string, typeof CHAR_COLORS[0]>();
  script.characters.forEach((c, i) => {
    colorMap.set(c.name, CHAR_COLORS[i % CHAR_COLORS.length]);
  });

  const chipStyle = (bg: string, color: string) =>
    `background:${bg};color:${color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;display:inline-block;margin:2px;`;

  const sectionHeader = (emoji: string, title: string, accent: string) => `
    <div style="display:flex;align-items:center;gap:8px;margin:20px 0 10px;border-bottom:2.5px solid ${accent};padding-bottom:6px;">
      <div style="width:5px;height:22px;background:${accent};border-radius:3px;flex-shrink:0;"></div>
      <span style="font-size:15px;font-weight:800;color:${accent};">${emoji} ${title}</span>
    </div>`;

  // ── 등장인물 카드 ──
  const characterCards = script.characters.map((c) => {
    const col = colorMap.get(c.name) || CHAR_COLORS[0];
    return `
      <div style="background:${col.bg};border:1.5px solid ${col.accent};border-radius:10px;padding:8px 10px;margin-bottom:6px;">
        <span style="background:${col.accent};color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;margin-right:8px;">${c.name}</span>
        <span style="font-size:10px;color:#374151;">${c.description}</span>
      </div>`;
  }).join('');

  // ── 핵심 용어 ──
  const keyTermRows = script.keyTerms.map((t) => `
    <tr>
      <td style="background:#EDE9FE;color:#5B21B6;font-weight:700;padding:5px 8px;border:1px solid #DDD6FE;font-size:10px;white-space:nowrap;">${t.term}</td>
      <td style="padding:5px 8px;border:1px solid #E5E7EB;font-size:10px;color:#374151;">${t.definition}</td>
    </tr>`).join('');

  // ── 대본 (2단 레이아웃) ──
  const half = Math.ceil(script.dialogue.length / 2);
  const leftLines = script.dialogue.slice(0, half);
  const rightLines = script.dialogue.slice(half);

  const renderDialogueLine = (line: { character: string; line: string }) => {
    const col = colorMap.get(line.character) || CHAR_COLORS[0];
    return `
      <div style="margin-bottom:7px;">
        <div style="background:${col.accent};color:#fff;display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;margin-bottom:3px;">${line.character}</div>
        <div style="background:${col.bg};border-left:3px solid ${col.accent};border-radius:0 6px 6px 0;padding:5px 8px;font-size:10px;color:#1F2937;line-height:1.5;">${line.line}</div>
      </div>`;
  };

  // ── 수업 포인트 ──
  const teachingPointsHTML = script.teachingPoints.map((p, i) => `
    <div style="background:#FFF7ED;border-left:3px solid #FB923C;border-radius:0 6px 6px 0;padding:5px 8px;margin-bottom:5px;font-size:10px;color:#374151;">
      <span style="font-weight:700;color:#EA580C;">${i + 1}. </span>${p}
    </div>`).join('');

  // ── 교사 팁 ──
  const teacherTipsHTML = script.teacherTips.map((t) => `
    <div style="background:#ECFDF5;border-left:3px solid #10B981;border-radius:0 6px 6px 0;padding:5px 8px;margin-bottom:5px;font-size:10px;color:#374151;">
      <span style="color:#059669;font-weight:700;">✓ </span>${t}
    </div>`).join('');

  // ── 성취기준 ──
  const achievementHTML = script.formData.includeAchievementStandards ? `
    ${sectionHeader('✅', '성취기준', '#6366F1')}
    <div style="background:#EEF2FF;border:1.5px solid #A5B4FC;border-radius:8px;padding:8px 12px;font-size:10px;color:#312E81;">
      <span style="font-weight:700;">[${script.achievementStandards.subject}]</span> ${script.achievementStandards.standard}
    </div>` : '';

  // ── 마무리 질문 ──
  const closingHTML = script.closingQuestions.map((q, i) => `
    <div style="background:#FDF2F8;border-left:3px solid #EC4899;border-radius:0 6px 6px 0;padding:5px 8px;margin-bottom:5px;font-size:10px;color:#9D174D;">
      <span style="font-weight:700;">Q${i + 1}. </span>${q}
    </div>`).join('');

  // ── 추가 옵션 배지 ──
  const optionBadges = [
    script.formData.includeDiscussionLeader ? '📝 토의/글쓰기 연계' : null,
    script.formData.includeStudentTeacherLayout ? '📋 학생용/교사용 2단 구성' : null,
    script.formData.includeAchievementStandards ? '✅ 성취기준 포함' : null,
  ].filter(Boolean).map(b => `<span style="${chipStyle('#F3E8FF', '#7C3AED')}">${b}</span>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
          background: #fff;
          color: #1F2937;
          width: 794px; /* A4 px */
        }
        .page { padding: 32px 36px; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- ── 커버 헤더 ── -->
        <div style="background:linear-gradient(135deg,#7C3AED,#A78BFA);border-radius:12px;padding:20px 24px;margin-bottom:20px;color:#fff;">
          <div style="font-size:10px;font-weight:600;opacity:0.85;margin-bottom:6px;">AI 역할극 대본</div>
          <div style="font-size:22px;font-weight:900;line-height:1.3;margin-bottom:12px;">${script.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${chipStyle('#fff', '#7C3AED') ? `
            <span style="${chipStyle('rgba(255,255,255,0.25)', '#fff')}">📚 ${script.formData.subject}</span>
            <span style="${chipStyle('rgba(255,255,255,0.25)', '#fff')}">🎓 ${script.formData.gradeLevel}</span>
            <span style="${chipStyle('rgba(255,255,255,0.25)', '#fff')}">⏱ ${script.formData.timeMinutes}분</span>
            <span style="${chipStyle('rgba(255,255,255,0.25)', '#fff')}">👥 ${script.formData.groupSize}명</span>
            <span style="${chipStyle('rgba(255,255,255,0.25)', '#fff')}">🎭 등장인물 ${script.formData.characterCount}명</span>
            ` : ''}
          </div>
          ${optionBadges ? `<div style="margin-top:8px;">${optionBadges}</div>` : ''}
        </div>

        <!-- ── 상황 및 역할 설명 ── -->
        ${sectionHeader('📋', '상황 및 역할 설명', '#7C3AED')}
        <div style="background:#F9F5FF;border-radius:8px;padding:10px 14px;font-size:10.5px;line-height:1.7;color:#374151;">${script.situationAndRole}</div>

        <!-- ── 등장인물 ── -->
        ${sectionHeader('👥', '등장인물', '#10B981')}
        ${characterCards}

        <!-- ── 핵심 용어 ── -->
        ${sectionHeader('📖', '핵심 용어', '#FBBF24')}
        <table>
          <thead>
            <tr>
              <th style="background:#7C3AED;color:#fff;padding:5px 8px;text-align:left;font-size:10px;border-radius:4px 0 0 0;">용어</th>
              <th style="background:#7C3AED;color:#fff;padding:5px 8px;text-align:left;font-size:10px;border-radius:0 4px 0 0;">설명</th>
            </tr>
          </thead>
          <tbody>${keyTermRows}</tbody>
        </table>

        <!-- ── 대본 (2단) ── -->
        ${sectionHeader('🎬', '대본 내용', '#7C3AED')}
        <div style="font-size:9px;color:#9CA3AF;margin-bottom:8px;font-style:italic;">[장면 시작] 등장인물들이 등장합니다.</div>
        <div style="display:flex;gap:12px;">
          <div style="flex:1;border-right:1.5px dashed #E5E7EB;padding-right:12px;">
            ${leftLines.map(renderDialogueLine).join('')}
          </div>
          <div style="flex:1;">
            ${rightLines.map(renderDialogueLine).join('')}
          </div>
        </div>

        <!-- ── 수업 포인트 ── -->
        ${sectionHeader('📝', '수업 포인트', '#FB923C')}
        ${teachingPointsHTML}

        <!-- ── 교사 팁 ── -->
        ${sectionHeader('💡', '교사용 지도 팁', '#10B981')}
        ${teacherTipsHTML}

        <!-- ── 성취기준 ── -->
        ${achievementHTML}

        <!-- ── 마무리 질문 ── -->
        ${sectionHeader('💬', '마무리 질문', '#EC4899')}
        ${closingHTML}

        <!-- ── 푸터 ── -->
        <div style="margin-top:24px;padding-top:10px;border-top:1.5px solid #E5E7EB;text-align:center;font-size:9px;color:#9CA3AF;">
          AI 역할극 대본 생성기 · MVROLEPLAY · ${script.formData.subject} ${script.formData.gradeLevel} 맞춤 대본
        </div>
      </div>
    </body>
    </html>`;
}

export async function downloadScriptAsPDF(script: GeneratedScript) {
  // 숨김 컨테이너에 HTML 렌더링
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;';
  container.innerHTML = buildPDFHTML(script);
  document.body.appendChild(container);

  // 잠시 대기 (폰트 로드)
  await new Promise(r => setTimeout(r, 300));

  const A4_W_MM = 210;
  const A4_H_MM = 297;
  const PX_PER_MM = 3.7795; // 1mm = 3.7795px at 96dpi

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // 페이지 단위로 캡처
  const contentEl = container.querySelector('.page') as HTMLElement;
  const totalH = contentEl.scrollHeight;
  const pageH_px = Math.floor(A4_H_MM * PX_PER_MM); // 약 1123px
  const pageW_px = Math.floor(A4_W_MM * PX_PER_MM);  // 약 794px

  // 전체 캔버스 한 번에 캡처
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: 794,
    height: totalH,
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const canvasH = canvas.height;
  const canvasW = canvas.width;

  // 캔버스를 A4 페이지 단위로 잘라 PDF에 추가
  const pageH_canvas = Math.floor(pageH_px * 2); // scale=2
  const pages = Math.ceil(canvasH / pageH_canvas);

  for (let p = 0; p < pages; p++) {
    if (p > 0) doc.addPage();

    // 해당 페이지 슬라이스 캔버스 생성
    const sliceCanvas = document.createElement('canvas');
    const sliceH = Math.min(pageH_canvas, canvasH - p * pageH_canvas);
    sliceCanvas.width = canvasW;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, p * pageH_canvas, canvasW, sliceH, 0, 0, canvasW, sliceH);

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
    const imgH_mm = (sliceH / canvasW) * A4_W_MM;

    doc.addImage(sliceData, 'JPEG', 0, 0, A4_W_MM, imgH_mm);
  }

  document.body.removeChild(container);

  const fileName = `${script.formData.subject}_${script.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 20)}_대본.pdf`;
  doc.save(fileName);
}
