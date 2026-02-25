import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageOrientation,
} from 'docx';
import { GeneratedScript } from '../app/App';

// 역할별 색상 (DOCX hex, shading용)
const CHAR_HEX_BG = [
  { bg: 'DBEAFE', accent: '3B82F6', text: '1D4ED8' }, // blue
  { bg: 'FCE7F3', accent: 'EC4899', text: '9D174D' }, // pink
  { bg: 'EDE9FE', accent: '8B5CF6', text: '5B21B6' }, // purple
  { bg: 'D1FAE5', accent: '10B981', text: '047857' }, // emerald
  { bg: 'FEF3C7', accent: 'FBBF24', text: '92400E' }, // amber
  { bg: 'CFFAFE', accent: '06B6D4', text: '0E7490' }, // cyan
  { bg: 'FEE2E2', accent: 'EF4444', text: '991B1B' }, // rose
  { bg: 'E0E7FF', accent: '6366F1', text: '312E81' }, // indigo
];

const PURPLE = '7C3AED';
const GREEN = '10B981';
const AMBER = 'FBBF24';
const PINK = 'EC4899';
const INDIGO = '6366F1';

/** 빈 문자열/공백만 있는 줄 제거, 연속 공백 정리 */
function cleanLines(lines: string[]): string[] {
  return (lines ?? [])
    .map((l) => (l ?? '').replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);
}

function heading(text: string, level: HeadingLevel = HeadingLevel.HEADING_2, color = PURPLE) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        color,
        size: level === HeadingLevel.HEADING_1 ? 32 : 24,
        font: 'Malgun Gothic',
      }),
    ],
  });
}

function bodyText(text: string, color = '1F2937', bold = false) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        color,
        bold,
        size: 20,
        font: 'Malgun Gothic',
      }),
    ],
  });
}

function divider(color = 'E5E7EB') {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color },
    },
    children: [],
  });
}

function sectionTitle(emoji: string, title: string, color: string) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    shading: { type: ShadingType.SOLID, color: 'F3F4F6', fill: 'F3F4F6' },
    children: [
      new TextRun({
        text: `${emoji}  ${title}`,
        bold: true,
        color,
        size: 26,
        font: 'Malgun Gothic',
      }),
    ],
    indent: { left: 160 },
  });
}

function bulletItem(text: string, num?: number) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: num !== undefined ? `${num}. ${text}` : `• ${text}`,
        size: 20,
        color: '374151',
        font: 'Malgun Gothic',
      }),
    ],
  });
}

function dialogueLine(character: string, line: string, colorIdx: number) {
  const c = CHAR_HEX_BG[colorIdx % CHAR_HEX_BG.length];
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { type: ShadingType.SOLID, color: c.bg, fill: c.bg },
    indent: { left: 160, right: 160 },
    border: {
      left: { style: BorderStyle.THICK, size: 12, color: c.accent },
    },
    children: [
      new TextRun({
        text: `[${character}]  `,
        bold: true,
        color: c.text,
        size: 20,
        font: 'Malgun Gothic',
      }),
      new TextRun({
        text: line,
        color: '1F2937',
        size: 20,
        font: 'Malgun Gothic',
      }),
    ],
  });
}

export async function downloadScriptAsDOCX(script: GeneratedScript) {
  const charColorIdxMap = new Map<string, number>();
  const sortedChars = [...script.characters].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  sortedChars.forEach((c, i) => {
    charColorIdxMap.set(c.name, i);
    if (typeof c.slot === 'number') charColorIdxMap.set(String(c.slot), i);
  });

  const children: Paragraph[] = [];

  // ─── 커버 ───────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: 'F3E8FF', fill: 'F3E8FF' },
      children: [
        new TextRun({
          text: 'AI 역할극 대본',
          bold: true,
          color: PURPLE,
          size: 36,
          font: 'Malgun Gothic',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: script.title,
          bold: true,
          color: '1F2937',
          size: 40,
          font: 'Malgun Gothic',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `📚 ${script.formData.subject}  |  🎓 ${script.formData.gradeLevel}  |  ⏱ ${script.formData.timeMinutes}분  |  👥 ${script.formData.groupSize}명  |  🎭 등장인물 ${script.formData.characterCount}명`,
          color: '6B7280',
          size: 20,
          font: 'Malgun Gothic',
        }),
      ],
    }),
    // 추가 옵션 표시
    ...[
      script.formData.includeDiscussionLeader ? '📝 토의/글쓰기 연계 포함' : null,
      script.formData.includeStudentTeacherLayout ? '📋 학생용/교사용 2단 구성 포함' : null,
      script.formData.includeAchievementStandards ? '✅ 성취기준 포함' : null,
    ].filter(Boolean).map(badge => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: badge as string,
          color: PURPLE,
          size: 18,
          bold: true,
          font: 'Malgun Gothic',
        }),
      ],
    })),
    divider(PURPLE),
  );

  // ─── 상황 및 역할 설명 ──────────────────────────────────────────
  children.push(
    sectionTitle('📋', '상황 및 역할 설명', PURPLE),
    new Paragraph({
      spacing: { after: 80 },
      indent: { left: 160, right: 160 },
      shading: { type: ShadingType.SOLID, color: 'F9F5FF', fill: 'F9F5FF' },
      children: [
        new TextRun({
          text: script.situationAndRole,
          color: '374151',
          size: 20,
          font: 'Malgun Gothic',
        }),
      ],
    }),
    divider(),
  );

  // ─── 등장인물 ──────────────────────────────────────────────────
  children.push(sectionTitle('👥', '등장인물', GREEN));
  script.characters.forEach((char) => {
    const idx = charColorIdxMap.get(char.name) ?? 0;
    const c = CHAR_HEX_BG[idx % CHAR_HEX_BG.length];
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 160, right: 160 },
        shading: { type: ShadingType.SOLID, color: c.bg, fill: c.bg },
        border: {
          left: { style: BorderStyle.THICK, size: 12, color: c.accent },
        },
        children: [
          new TextRun({ text: `${char.name}  `, bold: true, color: c.text, size: 22, font: 'Malgun Gothic' }),
          new TextRun({ text: char.description, color: '374151', size: 20, font: 'Malgun Gothic' }),
        ],
      })
    );
  });
  children.push(divider());

  // ─── 대본 ──────────────────────────────────────────────────────
  children.push(
    sectionTitle('🎬', '대본 내용', PURPLE),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: '[장면 시작] 등장인물들이 무대에 등장합니다.', italic: true, color: '9CA3AF', size: 18, font: 'Malgun Gothic' }),
      ],
      indent: { left: 160 },
    }),
  );

  script.dialogue.forEach((line) => {
    const text = (line.line ?? '').replace(/\s+/g, ' ').trim();
    if (text.length === 0) return; // 빈 줄은 문서에 넣지 않음
    const idx =
      typeof line.speakerSlot === 'number'
        ? (line.speakerSlot - 1) % script.characters.length
        : charColorIdxMap.get(line.character) ?? 0;
    const charLabel = line.character || `(${line.speakerSlot ?? '?'})`;
    children.push(dialogueLine(charLabel, text, idx));
  });
  children.push(divider());

  // ─── 수업 포인트 (빈 배열이면 섹션 생략)
  const teachingPoints = cleanLines(script.teachingPoints ?? []);
  if (teachingPoints.length > 0) {
    children.push(sectionTitle('📝', '수업 포인트', AMBER));
    teachingPoints.forEach((pt, i) => children.push(bulletItem(pt, i + 1)));
    children.push(new Paragraph({ spacing: { after: 120 } }));
  }

  // ─── 교사 팁 (빈 배열이면 섹션 생략)
  const teacherTips = cleanLines(script.teacherTips ?? []);
  if (teacherTips.length > 0) {
    children.push(sectionTitle('💡', '교사용 지도 팁', GREEN));
    teacherTips.forEach((tip) => children.push(bulletItem(`✓  ${tip}`)));
    children.push(divider());
  }

  // ─── 성취기준 ───────────────────────────────────────────────────
  if (script.formData.includeAchievementStandards) {
    children.push(
      sectionTitle('✅', '성취기준', INDIGO),
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: 160, right: 160 },
        shading: { type: ShadingType.SOLID, color: 'E0E7FF', fill: 'E0E7FF' },
        children: [
          new TextRun({ text: `[${script.achievementStandards.subject}]  `, bold: true, color: INDIGO, size: 20, font: 'Malgun Gothic' }),
          new TextRun({ text: script.achievementStandards.standard, color: '312E81', size: 20, font: 'Malgun Gothic' }),
        ],
      }),
      divider(),
    );
  }

  // ─── 마무리 질문 (빈 배열이면 섹션 생략)
  const closingQuestions = cleanLines(script.closingQuestions ?? []);
  if (closingQuestions.length > 0) {
    children.push(sectionTitle('💬', '마무리 질문', PINK));
    closingQuestions.forEach((q, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { left: 160, right: 160 },
          shading: { type: ShadingType.SOLID, color: 'FDF2F8', fill: 'FDF2F8' },
          border: { left: { style: BorderStyle.SINGLE, size: 8, color: PINK } },
          children: [
            new TextRun({ text: `Q${i + 1}.  ${q}`, color: '9D174D', size: 20, font: 'Malgun Gothic' }),
          ],
        })
      );
    });
  }

  // ─── 문서 생성 ──────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.PORTRAIT, width: 11906, height: 16838 }, // A4
            margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${script.formData.subject}_${script.title.slice(0, 20)}_대본.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
