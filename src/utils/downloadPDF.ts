import jsPDF from 'jspdf';
import { GeneratedScript } from '../app/App';

// A4 규격 (mm)
const A4_W = 210;
const A4_H = 297;
const MARGIN = 14;
const COL_GAP = 6;
const COL_W = (A4_W - MARGIN * 2 - COL_GAP) / 2;

// 역할별 색상 팔레트 (RGB)
const CHAR_COLORS: Array<{
  bg: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  label: string;
}> = [
  { bg: [219, 234, 254], accent: [59, 130, 246], text: [29, 78, 216], label: 'blue' },
  { bg: [252, 231, 243], accent: [236, 72, 153], text: [157, 23, 77], label: 'pink' },
  { bg: [237, 233, 254], accent: [139, 92, 246], text: [91, 33, 182], label: 'purple' },
  { bg: [209, 250, 229], accent: [16, 185, 129], text: [4, 120, 87], label: 'emerald' },
  { bg: [254, 243, 199], accent: [251, 191, 36], text: [146, 64, 14], label: 'amber' },
  { bg: [207, 250, 254], accent: [6, 182, 212], text: [14, 116, 144], label: 'cyan' },
  { bg: [254, 226, 226], accent: [239, 68, 68], text: [153, 27, 27], label: 'rose' },
  { bg: [224, 231, 255], accent: [99, 102, 241], text: [49, 46, 129], label: 'indigo' },
];

function loadFont(doc: jsPDF) {
  // 기본 폰트 사용 (한글은 별도 폰트 필요 — 여기서는 기본 latin 폰트 사용)
  doc.setFont('helvetica');
}

function setColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function setFillColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function wrapText(doc: jsPDF, text: string, maxW: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxW);
}

export async function downloadScriptAsPDF(script: GeneratedScript) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  loadFont(doc);

  // 캐릭터 → 색상 매핑
  const colorMap = new Map<string, typeof CHAR_COLORS[0]>();
  script.characters.forEach((c, i) => {
    colorMap.set(c.name, CHAR_COLORS[i % CHAR_COLORS.length]);
  });

  let pageNum = 1;

  const addPage = () => {
    doc.addPage();
    pageNum++;
    drawPageFrame(doc, pageNum, script);
  };

  // 페이지 공통 프레임
  const drawPageFrame = (d: jsPDF, num: number, s: GeneratedScript) => {
    // 상단 헤더 배경
    d.setFillColor(124, 58, 237);
    d.rect(0, 0, A4_W, 12, 'F');
    d.setTextColor(255, 255, 255);
    d.setFontSize(7);
    d.setFont('helvetica', 'bold');
    d.text(`역할극 대본 · ${s.formData.subject} · ${s.formData.gradeLevel}`, MARGIN, 8);
    d.text(`${num} / ?`, A4_W - MARGIN, 8, { align: 'right' });

    // 하단 푸터
    d.setFillColor(243, 228, 255);
    d.rect(0, A4_H - 8, A4_W, 8, 'F');
    d.setTextColor(124, 58, 237);
    d.setFontSize(6);
    d.setFont('helvetica', 'normal');
    d.text('AI 역할극 대본 생성기 · MVROLEPLAY', A4_W / 2, A4_H - 2.5, { align: 'center' });
  };

  // ─── 1페이지: 커버 ─────────────────────────────────────────────
  // 헤더 배경 (보라)
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, A4_W, 55, 'F');

  // 제목
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('AI \uc5ed\ud560\uadf9 \ub300\ubcf8', MARGIN, 20);

  doc.setFontSize(18);
  const titleLines = wrapText(doc, script.title, A4_W - MARGIN * 2, 18);
  let titleY = 32;
  titleLines.forEach(line => {
    doc.text(line, MARGIN, titleY);
    titleY += 9;
  });

  // 정보 칩
  const chips = [
    `\uacfc\ubaa9: ${script.formData.subject}`,
    `\ud559\ub144: ${script.formData.gradeLevel}`,
    `\uc2dc\uac04: ${script.formData.timeMinutes}\ubd84`,
    `\uc778\uc6d0: ${script.formData.groupSize}\uba85`,
    `\ub4f1\uc7a5\uc778\ubb3c: ${script.formData.characterCount}\uba85`,
  ];
  let chipX = MARGIN;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  chips.forEach(chip => {
    const w = doc.getTextWidth(chip) + 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(chipX, titleY + 3, w, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(91, 33, 182);
    doc.text(chip, chipX + 3, titleY + 7.5);
    chipX += w + 3;
    if (chipX > A4_W - MARGIN - 30) {
      chipX = MARGIN;
      titleY += 9;
    }
  });

  let y = 65;

  // ─── 상황 및 역할 설명 ───────────────────────────────────────────
  y = drawSectionHeader(doc, '\uc0c1\ud669 \ubc0f \uc5ed\ud560 \uc124\uba85', y, [124, 58, 237]);
  y += 1;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  const sitLines = wrapText(doc, script.situationAndRole, A4_W - MARGIN * 2, 8);
  sitLines.forEach(line => {
    if (y > A4_H - 20) { addPage(); y = 20; }
    doc.text(line, MARGIN, y);
    y += 4.5;
  });
  y += 4;

  // ─── 등장인물 ─────────────────────────────────────────────────────
  if (y > A4_H - 40) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\ub4f1\uc7a5\uc778\ubb3c', y, [16, 185, 129]);
  y += 2;

  const charColW = (A4_W - MARGIN * 2 - 4 * (Math.min(script.characters.length, 4) - 1)) / Math.min(script.characters.length, 4);
  let charX = MARGIN;
  let charRowY = y;
  script.characters.forEach((char, i) => {
    const color = colorMap.get(char.name) || CHAR_COLORS[0];
    if (i > 0 && i % 4 === 0) {
      charX = MARGIN;
      charRowY += 22;
      if (charRowY > A4_H - 20) { addPage(); charRowY = 20; }
    }
    // 카드 배경
    setFillColor(doc, color.bg);
    doc.setDrawColor(color.accent[0], color.accent[1], color.accent[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(charX, charRowY, charColW, 18, 2, 2, 'FD');
    // 이름 뱃지
    doc.setFillColor(color.accent[0], color.accent[1], color.accent[2]);
    doc.roundedRect(charX + 2, charRowY + 2, doc.getTextWidth(char.name) + 6, 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(char.name, charX + 5, charRowY + 6.3);
    // 설명
    doc.setTextColor(color.text[0], color.text[1], color.text[2]);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    const descLines = wrapText(doc, char.description, charColW - 4, 6.5).slice(0, 2);
    descLines.forEach((dl, di) => {
      doc.text(dl, charX + 2, charRowY + 11 + di * 3.5);
    });

    charX += charColW + 4;
  });
  y = charRowY + 22;
  y += 4;

  // ─── 핵심 용어 ────────────────────────────────────────────────────
  if (y > A4_H - 35) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\ud575\uc2ec \uc6a9\uc5b4', y, [251, 191, 36]);
  y += 2;
  script.keyTerms.slice(0, 8).forEach(term => {
    if (y > A4_H - 20) { addPage(); y = 20; }
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, A4_W - MARGIN * 2, 9, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(term.term, MARGIN + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    const defW = A4_W - MARGIN * 2 - doc.getTextWidth(term.term) - 12;
    const defText = doc.splitTextToSize(term.definition, defW)[0];
    doc.text(defText, MARGIN + doc.getTextWidth(term.term) + 8, y + 6);
    y += 11;
  });
  y += 4;

  // ─── 대본 (2단 레이아웃) ─────────────────────────────────────────
  if (y > A4_H - 40) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\ub300\ubcf8 \ub0b4\uc6a9', y, [124, 58, 237]);
  y += 3;

  // 2단 컬럼으로 대화 배치
  let leftY = y;
  let rightY = y;
  const leftX = MARGIN;
  const rightX = MARGIN + COL_W + COL_GAP;

  script.dialogue.forEach((line, idx) => {
    const color = colorMap.get(line.character) || CHAR_COLORS[0];
    const isLeft = idx % 2 === 0;
    const colX = isLeft ? leftX : rightX;
    let colY = isLeft ? leftY : rightY;

    // 페이지 넘김 체크
    const textLines = wrapText(doc, line.line, COL_W - 6, 7.5);
    const boxH = Math.max(textLines.length * 4 + 11, 16);

    if (colY + boxH > A4_H - 14) {
      addPage();
      leftY = 20;
      rightY = 20;
      colY = 20;
    }

    // 캐릭터 이름 뱃지
    const nameW = doc.getTextWidth(line.character) + 6;
    doc.setFillColor(color.accent[0], color.accent[1], color.accent[2]);
    doc.roundedRect(colX, colY, nameW, 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(line.character, colX + 3, colY + 4.2);

    // 말풍선
    const bubbleY = colY + 7;
    setFillColor(doc, color.bg);
    doc.setDrawColor(color.accent[0], color.accent[1], color.accent[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(colX, bubbleY, COL_W, boxH - 7, 2, 2, 'FD');

    // 대사 텍스트
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    textLines.forEach((tl, ti) => {
      doc.text(tl, colX + 3, bubbleY + 5.5 + ti * 4);
    });

    const usedH = boxH + 4;
    if (isLeft) leftY = colY + usedH;
    else rightY = colY + usedH;
  });

  // 두 컬럼 중 더 아래로 이동
  y = Math.max(leftY, rightY) + 4;

  // ─── 2페이지 섹션: 수업 가이드 + 성취기준 ─────────────────────
  if (y > A4_H - 40) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\uc218\uc5c5 \ud3ec\uc778\ud2b8', y, [251, 146, 60]);
  y += 2;
  script.teachingPoints.forEach((point, i) => {
    if (y > A4_H - 20) { addPage(); y = 20; }
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(251, 146, 60);
    doc.setLineWidth(0.3);
    const ptLines = wrapText(doc, `${i + 1}. ${point}`, A4_W - MARGIN * 2 - 4, 7.5);
    const ptH = ptLines.length * 4 + 5;
    doc.roundedRect(MARGIN, y, A4_W - MARGIN * 2, ptH, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    ptLines.forEach((pl, pi) => {
      doc.text(pl, MARGIN + 3, y + 5 + pi * 4);
    });
    y += ptH + 3;
  });
  y += 3;

  // 교사 팁
  if (y > A4_H - 35) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\uad50\uc0ac\uc6a9 \uc9c0\ub3c4 \ud301', y, [16, 185, 129]);
  y += 2;
  script.teacherTips.forEach((tip, i) => {
    if (y > A4_H - 20) { addPage(); y = 20; }
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    const tipLines = wrapText(doc, `✓  ${tip}`, A4_W - MARGIN * 2 - 4, 7.5);
    const tipH = tipLines.length * 4 + 5;
    doc.roundedRect(MARGIN, y, A4_W - MARGIN * 2, tipH, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(4, 120, 87);
    tipLines.forEach((tl, ti) => {
      doc.text(tl, MARGIN + 3, y + 5 + ti * 4);
    });
    y += tipH + 3;
  });
  y += 3;

  // 성취기준
  if (script.formData.includeAchievementStandards) {
    if (y > A4_H - 35) { addPage(); y = 20; }
    y = drawSectionHeader(doc, '\uc131\ucde8\uae30\uc900', y, [99, 102, 241]);
    y += 2;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);
    const stdLines = wrapText(doc, `[${script.achievementStandards.subject}] ${script.achievementStandards.standard}`, A4_W - MARGIN * 2 - 4, 7.5);
    const stdH = stdLines.length * 4 + 5;
    doc.roundedRect(MARGIN, y, A4_W - MARGIN * 2, stdH, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(49, 46, 129);
    stdLines.forEach((sl, si) => {
      doc.text(sl, MARGIN + 3, y + 5 + si * 4);
    });
    y += stdH + 3;
    y += 3;
  }

  // 마무리 질문
  if (y > A4_H - 35) { addPage(); y = 20; }
  y = drawSectionHeader(doc, '\ub9c8\ubb34\ub9ac \uc9c8\ubb38', y, [236, 72, 153]);
  y += 2;
  script.closingQuestions.forEach((q, i) => {
    if (y > A4_H - 20) { addPage(); y = 20; }
    doc.setFillColor(253, 242, 248);
    doc.setDrawColor(236, 72, 153);
    doc.setLineWidth(0.3);
    const qLines = wrapText(doc, `Q${i + 1}. ${q}`, A4_W - MARGIN * 2 - 4, 7.5);
    const qH = qLines.length * 4 + 5;
    doc.roundedRect(MARGIN, y, A4_W - MARGIN * 2, qH, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(157, 23, 77);
    qLines.forEach((ql, qi) => {
      doc.text(ql, MARGIN + 3, y + 5 + qi * 4);
    });
    y += qH + 3;
  });

  // 모든 페이지 하단 푸터 + 총 페이지수 업데이트
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFrame(doc, p, script);
    // 총 페이지수 덮어쓰기
    doc.setFillColor(124, 58, 237);
    doc.rect(A4_W - 28, 0, 28, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p} / ${totalPages}`, A4_W - MARGIN, 8, { align: 'right' });
  }

  const fileName = `${script.formData.subject}_${script.title.slice(0, 20)}_대본.pdf`;
  doc.save(fileName);
}

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  color: [number, number, number]
): number {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(MARGIN, y, 3, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, MARGIN + 6, y + 7);
  // 하단 구분선
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 9.5, A4_W - MARGIN, y + 9.5);
  return y + 13;
}
