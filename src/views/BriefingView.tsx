import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { MultiSelectFilter } from '../components/MultiSelectFilter';
import {
  Calendar,
  Clock,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  Building2,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Plus,
  Trash2,
  Edit3,
  X,
  LayoutGrid,
  GraduationCap,
  Info,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Play,
  FileSpreadsheet,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Eye,
  RefreshCw,
  Tag,
  Briefcase,
} from 'lucide-react';
import { formatDateBR, formatDateLongBR, getCollaboratorStatus, abbreviateName } from '../utils/helpers';
import { ProcessKnowledge, ProcessType } from '../types';

// Preset background images for Cover Slide
const PRESET_COVER_IMAGES = [
  { name: 'Centro de Distribuição', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Trabalho em Equipe', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Tecnologia & Logística', url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Docas & Expedição', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Segurança & Ergonomia', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Início de Turno / Amanhecer', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' },
];

// Preset operational images for Process Knowledge Cards
const PRESET_OPERATIONAL_IMAGES = [
  { name: 'Estoque / Inventário', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Ergonomia / Segurança', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
  { name: 'Docas / Operação', url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Avarias / Inspeção', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80' },
  { name: 'Packing / Caixas', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80' },
  { name: 'Bipagem / Scanner', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
];

// Curated daily operational motivational quotes
const MOTIVATIONAL_QUOTES = [
  'A segurança, a qualidade e o trabalho em equipe nos levarão a alcançar a excelência operacional todos os dias.',
  'A excelência da nossa logística é construída com o cuidado e a dedicação de cada um de nós neste turno.',
  'Pequenas melhorias diárias na operação geram grandes resultados e um ambiente de trabalho mais seguro.',
  'O sucesso da nossa equipe depende do foco, da comunicação clara e da colaboração constante.',
  'Trabalhar com segurança não é apenas uma regra, é o nosso maior compromisso com nós mesmos e nossas famílias.',
  'Nenhum processo é tão urgente que não possa ser realizado com total segurança, qualidade e padrão.',
  'Grande equipe, metas claras: juntos fazemos a operação logística fluir com máxima eficiência!',
];

/**
 * Helper to compress image files locally before storing in state.
 */
const compressImageFile = (file: File, maxWidth = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Smart Embed URL formatter for PDFs, Google Drive, Google Slides, and Canva.
 */
const formatDocumentEmbedUrl = (rawUrl: string, page: number): string => {
  if (!rawUrl) return '';
  const url = rawUrl.trim();

  // Google Drive File preview (e.g., https://drive.google.com/file/d/FILE_ID/view?usp=sharing)
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/file/d/${fileId}/preview#page=${page}`;
  }

  // Google Presentation / Slides (e.g., https://docs.google.com/presentation/d/PRESENTATION_ID/edit)
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch) {
    const presId = slidesMatch[1];
    return `https://docs.google.com/presentation/d/${presId}/embed?start=false&loop=false&delayms=3000#slide=id.p${page}`;
  }

  // Canva Embed
  if (url.includes('canva.com/design/')) {
    return url.includes('view?embed') ? url : `${url}?embed`;
  }

  // Direct Web PDF URL -> Use Google Docs Viewer
  if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?')) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}#page=${page}`;
  }

  return url;
};

export const BriefingView: React.FC = () => {
  const { state, updateBriefingConfig, addProcessKnowledge, updateProcessKnowledge, deleteProcessKnowledge, showNotice } = useApp();

  // 5 Slide Navigation Tabs: 1=cover, 2=operational_pdf, 3=process, 4=scale, 5=qa
  const [activeTab, setActiveTab] = useState<'cover' | 'operational_pdf' | 'process' | 'scale' | 'qa'>('cover');

  // Presentation Mode state
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationSlide, setPresentationSlide] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Fullscreen container ref
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  const activeDate = state.selectedDate;
  const briefingCfg = state.briefingConfig || {};

  // Slide 1 (Cover) Local State synced with briefingCfg
  const coverBgUrl = briefingCfg.coverBgUrl || PRESET_COVER_IMAGES[0].url;
  const motivationalQuote = briefingCfg.motivationalQuote || MOTIVATIONAL_QUOTES[0];
  const showQuote = briefingCfg.showQuote !== false;

  // Slide 2 (Operational PDF) Local State synced with briefingCfg
  const pdfUrl = briefingCfg.pdfUrl || '';
  const pdfPageNumber = briefingCfg.pdfPageNumber || 1;
  const pdfDirectImageUrl = briefingCfg.pdfDirectImageUrl || '';

  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);

  // Scale slide filters, view mode & name abbreviation options
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTLs, setSelectedTLs] = useState<string[]>([]);
  const [fontSizeMode, setFontSizeMode] = useState<'auto' | 'compact' | 'normal' | 'large'>('auto');
  const [showIntervals, setShowIntervals] = useState(true);
  const [abbreviateNames, setAbbreviateNames] = useState(true); // Default enabled as requested
  const [dimensioningViewMode, setDimensioningViewMode] = useState<'task_grid' | 'meal_slots'>('task_grid');
  const [mealTypeLabel, setMealTypeLabel] = useState<'janta' | 'almoco' | 'refeicao'>(() => {
    const shift = (state.teamShift || '').toUpperCase();
    if (['T1', 'T4'].includes(shift)) return 'almoco';
    return 'janta';
  });

  // Slide 5 (Q&A / Perguntas) state
  const DEFAULT_QA_QUESTIONS = [
    'Alguma dúvida em relação ao dimensionamento e alocação de tarefas do dia?',
    'Dúvidas sobre os horários de janta, pausas e revezamento da equipe?',
    'Alinhamento de segurança do trabalho, ergonomia e uso correto de EPIs?',
    'Avisos da liderança, metas de produtividade e sugestões gerais do turno?',
  ];
  const [qaQuestions, setQaQuestions] = useState<string[]>(() => {
    return briefingCfg.qaQuestions && briefingCfg.qaQuestions.length > 0
      ? briefingCfg.qaQuestions
      : DEFAULT_QA_QUESTIONS;
  });
  const [newQaInput, setNewQaInput] = useState('');

  // Process Knowledge state
  const processList = state.processKnowledgeList || [];
  const [selectedProcessId, setSelectedProcessId] = useState<string>(processList[0]?.id || '');
  const [selectedProcessCategories, setSelectedProcessCategories] = useState<string[]>([]);
  const [selectedProcessTypes, setSelectedProcessTypes] = useState<string[]>([]);

  // Modal State for Process Knowledge CRUD
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<ProcessType>('explicacao');
  const [categoryInput, setCategoryInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [keyTakeawaysInput, setKeyTakeawaysInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingProcessImage, setIsUploadingProcessImage] = useState(false);

  // Metadata for filter options
  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role || 'Operador'))).filter(Boolean);
  const roleOptions = allRoles.map((r) => ({ label: r, value: r }));

  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category || 'Geral'))).filter(Boolean);
  const categoryOptions = allCategories.map((c) => ({ label: c, value: c }));

  const allTLs = Array.from(new Set(state.collaborators.map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time'))).filter(Boolean);
  const tlOptions = allTLs.map((tl) => ({ label: tl, value: tl }));

  const processCategories = Array.from(new Set(processList.map((p) => p.category))).filter(Boolean);
  const processCategoryOptions = processCategories.map((c) => ({ label: c, value: c }));

  const processTypeOptions = [
    { label: 'Explicação', value: 'explicacao' },
    { label: 'Segurança', value: 'seguranca' },
    { label: 'Qualidade', value: 'qualidade' },
    { label: 'Dica Prática', value: 'dica' },
  ];

  // Active collaborators and presence
  const activeCollaborators = state.collaborators || [];
  const dayIntervals = state.intervals[activeDate] || {};

  const presentCollaborators = activeCollaborators.filter((c) => {
    const statusInfo = getCollaboratorStatus(c, activeDate, state);
    return statusInfo.status === 'presente';
  });

  // Process tasks for Scale Slide
  const processedTasks = (state.tasks || [])
    .filter((t) => t.active !== false)
    .map((task) => {
      const taskMembers = (task.members || [])
        .map((mId) => state.collaborators.find((c) => c.id === mId))
        .filter((c): c is NonNullable<typeof c> => {
          if (!c) return false;
          const statusInfo = getCollaboratorStatus(c, activeDate, state);
          if (statusInfo.status !== 'presente') return false;

          if (selectedRoles.length > 0 && !selectedRoles.includes(c.role)) return false;
          if (selectedCategories.length > 0 && !selectedCategories.includes(c.category)) return false;
          if (selectedTLs.length > 0 && !selectedTLs.includes(c.teamLeader || state.defaultTeamLeader || 'Sem Time')) return false;

          return true;
        });

      return {
        ...task,
        taskMembers,
      };
    })
    .filter((task) => task.taskMembers.length > 0);

  // Helper to find break slot time for a person
  const getBreakTime = (personId: string) => {
    const slot = (state.breaks || []).find((b) => (dayIntervals[b.id] || []).includes(personId));
    return slot ? slot.time : null;
  };

  // Helper to group members of a task by their break slot
  const groupTaskMembersByBreakTime = (taskMembers: Array<{ id: string; name: string }>) => {
    const map = new Map<string, Array<{ id: string; name: string }>>();

    taskMembers.forEach((person) => {
      const time = getBreakTime(person.id) || 'Sem Horário Definido';
      if (!map.has(time)) {
        map.set(time, []);
      }
      map.get(time)!.push(person);
    });

    const result: Array<{ timeLabel: string; members: Array<{ id: string; name: string }> }> = [];
    map.forEach((members, timeLabel) => {
      result.push({ timeLabel, members });
    });

    result.sort((a, b) => {
      if (a.timeLabel.includes('Sem Horário')) return 1;
      if (b.timeLabel.includes('Sem Horário')) return -1;
      return a.timeLabel.localeCompare(b.timeLabel);
    });

    return result;
  };

  // Toggle Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (presentationContainerRef.current) {
        presentationContainerRef.current.requestFullscreen?.().catch(() => {});
      } else {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setPresentationSlide((prev) => (prev < 5 ? ((prev + 1) as 1 | 2 | 3 | 4 | 5) : 5));
      } else if (e.key === 'ArrowLeft') {
        setPresentationSlide((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : 1));
      } else if (e.key === 'Escape') {
        setIsPresentationMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode]);

  // Handle Cover BG Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const compressed = await compressImageFile(file, 1200);
      updateBriefingConfig({ coverBgUrl: compressed });
      showNotice('Imagem de fundo da capa atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao carregar imagem.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle Slide Image Upload for Operational PDF fallback
  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingSlideImage(true);
      const compressed = await compressImageFile(file, 1200);
      updateBriefingConfig({ pdfDirectImageUrl: compressed });
      showNotice('Imagem da folha do slide carregada!');
    } catch (err) {
      alert('Erro ao carregar imagem.');
    } finally {
      setIsUploadingSlideImage(false);
    }
  };

  // Random quote generator
  const handleRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    const newQuote = MOTIVATIONAL_QUOTES[randomIndex];
    updateBriefingConfig({ motivationalQuote: newQuote });
  };

  // Process Knowledge Filtering
  const filteredProcessList = processList.filter((p) => {
    const matchesCat = selectedProcessCategories.length === 0 || selectedProcessCategories.includes(p.category);
    const matchesType = selectedProcessTypes.length === 0 || selectedProcessTypes.includes(p.type);
    return matchesCat && matchesType;
  });

  const activeProcessIndex = filteredProcessList.findIndex((p) => p.id === selectedProcessId);
  const currentProcess: ProcessKnowledge | undefined =
    filteredProcessList[activeProcessIndex] || filteredProcessList[0] || processList[0];

  const handleNextProcess = () => {
    if (filteredProcessList.length === 0) return;
    const nextIdx = (activeProcessIndex + 1) % filteredProcessList.length;
    setSelectedProcessId(filteredProcessList[nextIdx].id);
  };

  const handlePrevProcess = () => {
    if (filteredProcessList.length === 0) return;
    const prevIdx = (activeProcessIndex - 1 + filteredProcessList.length) % filteredProcessList.length;
    setSelectedProcessId(filteredProcessList[prevIdx].id);
  };

  const handleRandomProcess = () => {
    if (filteredProcessList.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredProcessList.length);
    setSelectedProcessId(filteredProcessList[randomIdx].id);
  };

  // Process CRUD Handlers
  const handleOpenAddProcessModal = () => {
    setEditingProcessId(null);
    setTitleInput('');
    setTypeInput('explicacao');
    setCategoryInput(state.sector || 'Operação');
    setDescriptionInput('');
    setKeyTakeawaysInput('');
    setImageUrlInput('');
    setIsManageModalOpen(true);
  };

  const handleOpenEditProcessModal = (item: ProcessKnowledge) => {
    setEditingProcessId(item.id);
    setTitleInput(item.title);
    setTypeInput(item.type);
    setCategoryInput(item.category);
    setDescriptionInput(item.description);
    setKeyTakeawaysInput((item.keyTakeaways || []).join('\n'));
    setImageUrlInput(item.imageUrl || '');
    setIsManageModalOpen(true);
  };

  const handleSaveProcess = () => {
    if (!titleInput.trim()) return;
    const takeaways = keyTakeawaysInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProcessId) {
      updateProcessKnowledge(editingProcessId, {
        title: titleInput.trim(),
        type: typeInput,
        category: categoryInput.trim() || 'Geral',
        description: descriptionInput.trim(),
        keyTakeaways: takeaways,
        imageUrl: imageUrlInput.trim() || undefined,
      });
    } else {
      addProcessKnowledge({
        title: titleInput.trim(),
        type: typeInput,
        category: categoryInput.trim() || 'Geral',
        description: descriptionInput.trim(),
        keyTakeaways: takeaways,
        imageUrl: imageUrlInput.trim() || undefined,
        active: true,
      });
    }
    setIsManageModalOpen(false);
  };

  // Type badge details
  const getTypeBadgeDetails = (type: ProcessType) => {
    switch (type) {
      case 'caracteristica':
        return {
          label: 'Característica do Processo',
          bg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
          icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
        };
      case 'curiosidade':
        return {
          label: 'Curiosidade Operacional',
          bg: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800',
          icon: <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        };
      case 'explicacao':
        return {
          label: 'Explicação do Processo',
          bg: 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800',
          icon: <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        };
      case 'procedimento':
        return {
          label: 'Procedimento Padrão (SOP)',
          bg: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800',
          icon: <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        };
      case 'seguranca':
        return {
          label: 'Segurança do Trabalho',
          bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'qualidade':
        return {
          label: 'Conformidade & Qualidade',
          bg: 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800',
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        };
      default:
        return {
          label: 'Informação de Processo',
          bg: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
          icon: <Info className="w-4 h-4 text-gray-600" />,
        };
    }
  };

  const totalDimensioned = processedTasks.reduce((acc, t) => acc + t.taskMembers.length, 0);

  let nameFontSize = 'text-xs';
  let dotPaddingClass = 'py-0.5';

  if (fontSizeMode === 'compact') {
    nameFontSize = 'text-[10px]';
    dotPaddingClass = 'py-0.2';
  } else if (fontSizeMode === 'normal') {
    nameFontSize = 'text-xs font-semibold';
    dotPaddingClass = 'py-0.5';
  } else if (fontSizeMode === 'large') {
    nameFontSize = 'text-sm font-bold';
    dotPaddingClass = 'py-1';
  } else {
    if (totalDimensioned > 45) {
      nameFontSize = 'text-[10px]';
      dotPaddingClass = 'py-0.2';
    } else if (totalDimensioned > 25) {
      nameFontSize = 'text-[11px]';
      dotPaddingClass = 'py-0.5';
    } else {
      nameFontSize = 'text-xs font-bold';
      dotPaddingClass = 'py-1';
    }
  }

  // Active Embed URL for Slide 2
  const activeEmbedUrl = formatDocumentEmbedUrl(pdfUrl, pdfPageNumber);

  // Render individual slide component by index (1..5)
  const renderSlideContent = (slideNumber: 1 | 2 | 3 | 4 | 5) => {
    switch (slideNumber) {
      case 1:
        // SLIDE 1: COVER / APRESENTAÇÃO
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl bg-slate-950 text-white flex flex-col justify-between p-8 sm:p-12">
            {/* Background Image with Dark Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
              style={{ backgroundImage: `url(${coverBgUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

            {/* Header Identity Badge */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-xl shadow-lg border border-white/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white">
                    {state.teamName || 'OPERAÇÃO LOGÍSTICA'}
                  </h3>
                  <p className="text-xs font-bold text-slate-300 tracking-wide uppercase">
                    SETOR {state.sector || 'OPERACIONAL'} • TURNO {state.teamShift || 'T2'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-black">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-white capitalize">{formatDateLongBR(activeDate)}</span>
              </div>
            </div>

            {/* Center Main Presentation Title */}
            <div className="relative z-10 my-auto py-6 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Briefing Diário Operacional</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
                Alinhamento de Turno & Informativo Diário
              </h1>

              {showQuote && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-slate-200 italic font-medium text-sm sm:text-base flex items-start gap-3 shadow-md">
                  <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="not-italic text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 mb-1">
                      Frase Motivacional do Dia
                    </p>
                    <p>"{motivationalQuote}"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Metrics */}
            <div className="relative z-10 flex flex-wrap items-center justify-between border-t border-white/20 pt-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>
                    Equipe Presente Hoje: <strong className="text-white font-extrabold text-sm">{presentCollaborators.length}</strong> colaboradores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>
                    Gestor: <strong className="text-white font-extrabold">{state.manager || 'Geral'}</strong>
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                Slide 1 de 4 • Capa de Apresentação
              </div>
            </div>
          </div>
        );

      case 2:
        // SLIDE 2: INFORMATIVO DA OPERAÇÃO (PDF / DOCUMENT)
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl bg-[var(--paper)] flex flex-col justify-between p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ink)] uppercase tracking-wide">
                    2. Informativo da Operação
                  </h3>
                  <p className="text-[11px] font-bold text-[var(--muted)]">
                    Informativo diário emitido pela liderança/qualidade • Página {pdfPageNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-black">
                  Página {pdfPageNumber} selecionada
                </span>
              </div>
            </div>

            {/* Document Render Area */}
            <div className="my-3 flex-1 min-h-0 bg-[var(--bg)] rounded-2xl border border-[var(--line)] overflow-hidden relative flex flex-col items-center justify-center">
              {pdfDirectImageUrl ? (
                // Direct uploaded slide image
                <div className="w-full h-full flex items-center justify-center p-2 bg-slate-900">
                  <img
                    src={pdfDirectImageUrl}
                    alt="Informativo Operacional"
                    className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                  />
                </div>
              ) : activeEmbedUrl ? (
                // Interactive Embedded PDF / Document Viewer
                <iframe
                  src={activeEmbedUrl}
                  title="Informativo Operacional do Dia"
                  className="w-full h-full border-none rounded-2xl bg-white"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                // Empty state preview prompt
                <div className="p-8 text-center space-y-3 max-w-md">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-[var(--ink)]">
                    Nenhum Informativo PDF Carregado
                  </h4>
                  <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                    Cole o link do PDF no campo abaixo ou faça upload de uma foto da folha do informativo para exibir nesta tela de briefing.
                  </p>
                </div>
              )}
            </div>

            {/* Slide 2 Footer */}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs font-bold text-[var(--muted)]">
              <span className="truncate max-w-md">
                {pdfUrl ? `URL: ${pdfUrl}` : 'Insira a URL do PDF ou Google Drive nas opções'}
              </span>
              <span className="text-[10px] uppercase font-black text-[var(--primary)]">
                Slide 2 de 4 • Informativo Operacional
              </span>
            </div>
          </div>
        );

      case 3:
        // SLIDE 3: REFORÇO DE CONHECIMENTO DO PROCESSO
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl bg-[var(--paper)] flex flex-col justify-between p-6 sm:p-8">
            {currentProcess ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[var(--ink)] uppercase tracking-wide">
                        3. Reforço de Conhecimento do Processo
                      </h3>
                      <p className="text-xs font-bold text-[var(--muted)]">
                        {currentProcess.category} • Card {activeProcessIndex + 1} de {filteredProcessList.length}
                      </p>
                    </div>
                  </div>

                  {/* Badge */}
                  {(() => {
                    const badge = getTypeBadgeDetails(currentProcess.type);
                    return (
                      <span className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Main Process Content */}
                <div className="my-auto py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className={`${currentProcess.imageUrl ? 'md:col-span-7' : 'md:col-span-12'} space-y-4`}>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] leading-snug">
                      {currentProcess.title}
                    </h2>

                    <div className="bg-[var(--bg)] p-4 rounded-2xl border border-[var(--line)] text-sm sm:text-base font-medium text-[var(--ink)] leading-relaxed">
                      {currentProcess.description}
                    </div>

                    {currentProcess.keyTakeaways && currentProcess.keyTakeaways.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Pontos de Atenção & Boas Práticas:</span>
                        </h4>
                        <ul className="grid grid-cols-1 gap-2">
                          {currentProcess.keyTakeaways.map((takeaway, idx) => (
                            <li
                              key={idx}
                              className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100 p-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-start gap-2"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                                {idx + 1}
                              </span>
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {currentProcess.imageUrl && (
                    <div className="md:col-span-5 flex items-center justify-center">
                      <img
                        src={currentProcess.imageUrl}
                        alt={currentProcess.title}
                        className="max-h-64 sm:max-h-72 w-full object-cover rounded-2xl border border-[var(--line)] shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs font-bold text-[var(--muted)]">
                  <span>Equipe: {state.teamName}</span>
                  <span className="text-[10px] font-black uppercase text-purple-600">
                    Slide 3 de 4 • Reforço de Processo
                  </span>
                </div>
              </>
            ) : (
              <div className="p-12 text-center space-y-3 my-auto">
                <GraduationCap className="w-12 h-12 text-purple-600 mx-auto" />
                <h3 className="text-lg font-black text-[var(--ink)]">
                  Nenhum Card de Conhecimento de Processo Encontrado
                </h3>
                <p className="text-xs text-[var(--muted)] font-medium">
                  Cadastre tópicos de treinamento ou boas práticas para apresentar neste slide do briefing.
                </p>
                <button
                  onClick={handleOpenAddProcessModal}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-xl hover:bg-purple-700 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Processo</span>
                </button>
              </div>
            )}
          </div>
        );

      case 4:
        // SLIDE 4: ESCALA E DIMENSIONAMENTO (OPTIMIZED FOR LARGE TEAMS & SPACE UTILIZATION)
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl bg-[var(--paper)] flex flex-col justify-between p-4 sm:p-6">
            {/* Header with Layout Controls */}
            <div className="flex flex-wrap items-center justify-between border-b border-[var(--line)] pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ink)] uppercase tracking-wide">
                    4. Escala e Dimensionamento de Tarefas
                  </h3>
                  <p className="text-[11px] font-bold text-[var(--muted)]">
                    {state.teamName} • {formatDateBR(activeDate)} • {presentCollaborators.length} Presentes
                  </p>
                </div>
              </div>

              {/* View mode toggle & Abbreviation toggle inside slide header */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setAbbreviateNames(!abbreviateNames)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black border cursor-pointer transition-all ${
                    abbreviateNames
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300'
                      : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                  title="Abreviar nomes (ex: ANA S., CAMILA R.) para aumentar fonte e visibilidade"
                >
                  {abbreviateNames ? 'Nomes Abreviados' : 'Nomes Completos'}
                </button>

                <div className="flex items-center bg-[var(--bg)] border border-[var(--line)] p-0.5 rounded-lg font-bold text-[11px]">
                  <button
                    onClick={() => setDimensioningViewMode('task_grid')}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      dimensioningViewMode === 'task_grid'
                        ? 'bg-[var(--primary)] text-white font-extrabold shadow-2xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Por Tarefa
                  </button>
                  <button
                    onClick={() => setDimensioningViewMode('meal_slots')}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      dimensioningViewMode === 'meal_slots'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-2xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Por Horário de {mealTypeLabel === 'almoco' ? 'Almoço' : 'Janta'}
                  </button>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 rounded-lg font-extrabold">
                  Alocados: {totalDimensioned}
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="my-3 flex-1 overflow-y-auto pr-1">
              {dimensioningViewMode === 'task_grid' ? (
                /* TASK GRID MODE (With visual time section dividers to prevent repetition) */
                processedTasks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {processedTasks.map((task) => {
                      const isLargeTask = task.taskMembers.length >= 7;
                      const timeGroups = groupTaskMembersByBreakTime(task.taskMembers);

                      return (
                        <div
                          key={task.id}
                          className={`bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-3 flex flex-col justify-between space-y-2.5 shadow-2xs transition-all ${
                            isLargeTask ? 'sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-[var(--bg)] to-[var(--paper)]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                            <h4 className="font-black text-xs text-[var(--ink)] uppercase tracking-wide truncate" title={task.name}>
                              {task.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)] rounded-full text-[11px] font-black shrink-0">
                              {task.taskMembers.length} {task.taskMembers.length === 1 ? 'pessoa' : 'pessoas'}
                            </span>
                          </div>

                          <div className="space-y-2 flex-1">
                            {timeGroups.map((group, idx) => (
                              <div key={idx} className="space-y-1">
                                {/* Time Section Divider */}
                                {showIntervals && (
                                  <div className="flex items-center justify-between px-2 py-1 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 rounded-lg text-amber-800 dark:text-amber-200">
                                    <span className="flex items-center gap-1 text-[11px] font-black">
                                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span>{group.timeLabel}</span>
                                    </span>
                                    <span className="text-[10px] font-bold opacity-75">
                                      {group.members.length} {group.members.length === 1 ? 'colaborador' : 'colaboradores'}
                                    </span>
                                  </div>
                                )}

                                {/* Collaborators in this time slot */}
                                <div className={isLargeTask ? 'grid grid-cols-1 sm:grid-cols-2 gap-1' : 'space-y-1'}>
                                  {group.members.map((person) => {
                                    const displayName = abbreviateNames
                                      ? abbreviateName(person.name, true)
                                      : person.name;

                                    return (
                                      <div
                                        key={person.id}
                                        className="flex items-center justify-between bg-[var(--paper)] border border-[var(--line)] rounded-xl px-2.5 py-1.5 hover:border-[var(--primary-border)] transition-colors shadow-2xs"
                                      >
                                        <span className="font-extrabold text-[var(--ink)] truncate text-xs sm:text-sm">
                                          {displayName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--muted)] font-bold">
                    Nenhuma tarefa dimensionada para o turno atual.
                  </div>
                )
              ) : (
                /* MEAL SLOTS MODE (Visual de Intervalos com nomes por horário de janta) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {(state.breaks || []).map((slot) => {
                    const idsInSlot = dayIntervals[slot.id] || [];
                    const membersInSlot = idsInSlot
                      .map((id) => presentCollaborators.find((c) => c.id === id))
                      .filter((c): c is NonNullable<typeof c> => Boolean(c));

                    if (membersInSlot.length === 0) return null;

                    return (
                      <div
                        key={slot.id}
                        className="bg-[var(--bg)] border border-amber-300 dark:border-amber-900/60 rounded-2xl p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-amber-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-2xs">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-sm">{slot.time}</span>
                            </span>
                            <span className="font-black text-xs uppercase text-[var(--ink)]">
                              Horário de {mealTypeLabel === 'almoco' ? 'Almoço' : 'Janta'}
                            </span>
                          </div>
                          <span className="text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                            {membersInSlot.length}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {membersInSlot.map((person) => {
                            const assignedTask = state.tasks.find((t) => t.members.includes(person.id));
                            const displayName = abbreviateNames
                              ? abbreviateName(person.name, true)
                              : person.name;

                            return (
                              <div
                                key={person.id}
                                className="p-2 bg-[var(--paper)] border border-[var(--line)] rounded-xl flex items-center justify-between shadow-2xs"
                              >
                                <span className="font-black text-xs sm:text-sm text-[var(--ink)] truncate">
                                  {displayName}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-[var(--primary-soft)] text-[var(--primary)] rounded-md border border-[var(--primary-border)] truncate max-w-[120px]">
                                  {assignedTask ? assignedTask.name : 'Sem Tarefa'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5 text-xs font-bold text-[var(--muted)]">
              <span>{formatDateLongBR(activeDate)}</span>
              <span className="text-[10px] font-black uppercase text-[var(--primary)]">
                Slide 4 de 5 • Escala e Dimensionamento
              </span>
            </div>
          </div>
        );

      case 5:
        // SLIDE 5: SEÇÃO DE PERGUNTAS, DÚVIDAS & ALINHAMENTOS DO TURNO
        return (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl bg-gradient-to-br from-[var(--paper)] via-[var(--bg)] to-[var(--paper)] flex flex-col justify-between p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[var(--ink)] uppercase tracking-wide">
                    5. Seção de Perguntas, Dúvidas e Alinhamentos
                  </h3>
                  <p className="text-xs font-bold text-[var(--muted)]">
                    {state.teamName} • Espaço aberto para dúvidas da equipe e avisos da liderança
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded-xl font-black text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Espaço Aberto ao Time</span>
              </span>
            </div>

            {/* Main Content Grid */}
            <div className="my-3 flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch overflow-y-auto pr-1">
              {/* Left Column: Questions List */}
              <div className="md:col-span-7 bg-[var(--paper)] border border-[var(--line)] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-[var(--ink)]">
                    Tópicos de Discussão & Dúvidas do Turno
                  </h4>
                </div>

                <div className="space-y-2 flex-1">
                  {qaQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl flex items-start gap-3 hover:border-purple-400 transition-colors shadow-2xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-[var(--ink)] leading-snug pt-0.5">
                        {q}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Operational Safety & Leadership Alignment Cards */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Segurança do Trabalho & EPIs</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--ink)] leading-relaxed">
                    Valide o uso de calçados de segurança, luvas e coletes refletores antes de dirigir-se às áreas operacionais.
                  </p>
                </div>

                <div className="p-3.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-300 dark:border-blue-800/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-xs uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Foco em Qualidade & Erro Zero</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--ink)] leading-relaxed">
                    Sempre bipe o código do produto e do endereço. Em caso de avaria ou divergência, notifique o Team Leader.
                  </p>
                </div>

                <div className="p-3.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300 dark:border-purple-800/80 rounded-2xl space-y-1.5 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-black text-xs uppercase tracking-wide">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Suporte da Liderança</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--ink)] leading-relaxed">
                    Algum apontamento adicional? Procure seu Team Leader (<strong>{state.defaultTeamLeader || 'Líder do Turno'}</strong>) durante a operação.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-2.5 text-xs font-bold text-[var(--muted)]">
              <span>{formatDateLongBR(activeDate)}</span>
              <span className="text-[10px] font-black uppercase text-purple-600">
                Slide 5 de 5 • Perguntas e Respostas
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* HEADER & SLIDE SELECTION NAVIGATION */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-3 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 4 Main Slide Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('cover')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === 'cover'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-emerald-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1. Capa / Apresentação</span>
            </button>

            <button
              onClick={() => setActiveTab('operational_pdf')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === 'operational_pdf'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-blue-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Informativo da Operação</span>
              {pdfUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('process')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === 'process'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-purple-600'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>3. Reforço do Processo</span>
              {processList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                  {processList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('scale')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === 'scale'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>4. Escala e Dimensionamento</span>
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === 'qa'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-purple-600'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>5. Perguntas & Dúvidas</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                let initialSlide: 1 | 2 | 3 | 4 | 5 = 1;
                if (activeTab === 'operational_pdf') initialSlide = 2;
                if (activeTab === 'process') initialSlide = 3;
                if (activeTab === 'scale') initialSlide = 4;
                if (activeTab === 'qa') initialSlide = 5;
                setPresentationSlide(initialSlide);
                setIsPresentationMode(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Apresentação Completa (Modo TV)</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--primary-soft)] rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Alternar Modo Tela Cheia (Fullscreen)"
            >
              <Maximize2 className="w-4 h-4 text-[var(--primary)]" />
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--primary-soft)] rounded-xl text-xs font-black cursor-pointer transition-colors"
              title="Imprimir / Exportar PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE TAB CONFIGURATION & CONTROLS PANEL */}

      {/* TAB 1: COVER CONTROLS */}
      {activeTab === 'cover' && (
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h4 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Personalizar Slide 1: Capa da Apresentação</span>
            </h4>
            <span className="text-[10px] font-bold text-[var(--muted)]">
              Visualização ao Vivo Abaixo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Background Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Imagem de Fundo da Capa</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_COVER_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateBriefingConfig({ coverBgUrl: preset.url })}
                    className={`relative rounded-xl overflow-hidden h-14 border-2 transition-all cursor-pointer ${
                      coverBgUrl === preset.url
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-[var(--line)] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold p-0.5 truncate text-center">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="px-3 py-1.5 bg-[var(--bg)] hover:bg-[var(--line)] border border-[var(--line)] rounded-xl text-[11px] font-bold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isUploadingCover ? 'Carregando...' : 'Fazer Upload de Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Motivational Quote Config */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Frase Motivacional do Dia (Opcional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRandomQuote}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg text-[10px] font-black hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Gerar Outra Frase</span>
                  </button>

                  <label className="flex items-center gap-1 text-[10px] font-extrabold text-[var(--ink)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQuote}
                      onChange={(e) => updateBriefingConfig({ showQuote: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Exibir no Slide</span>
                  </label>
                </div>
              </div>

              <textarea
                rows={2}
                value={motivationalQuote}
                onChange={(e) => updateBriefingConfig({ motivationalQuote: e.target.value })}
                placeholder="Digite a mensagem ou orientação para o time hoje..."
                className="w-full p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-medium text-[var(--ink)] text-xs focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONAL PDF CONTROLS */}
      {activeTab === 'operational_pdf' && (
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h4 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Configurar Slide 2: Link do Informativo Operacional (PDF Online)</span>
            </h4>

            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="text-[11px] font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHelpGuide ? 'Ocultar Ajuda' : 'Como usar links do Google Drive?'}</span>
            </button>
          </div>

          {showHelpGuide && (
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 p-3 rounded-xl text-xs text-blue-950 dark:text-blue-100 space-y-1.5 animate-in fade-in">
              <p className="font-extrabold flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Instruções de Integração de PDFs & Apresentações Google:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 font-medium text-[11px]">
                <li>
                  No Google Drive, clique com o botão direito no PDF do Informativo e selecione <strong>Compartilhar -&gt; Copiar Link</strong>.
                </li>
                <li>
                  Certifique-se que a permissão de acesso está configurada como <strong>"Qualquer pessoa com o link"</strong>.
                </li>
                <li>
                  Cole o link gerado no campo abaixo. Nossa aplicação converterá o visualizador automaticamente e permitirá navegar entre as páginas!
                </li>
              </ol>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            {/* Input URL */}
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Link / URL do PDF ou Apresentação Online</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => updateBriefingConfig({ pdfUrl: e.target.value })}
                  placeholder="Ex: https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing"
                  className="flex-1 p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-blue-500"
                />
                {pdfUrl && (
                  <button
                    onClick={() => updateBriefingConfig({ pdfUrl: '' })}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                    title="Limpar URL"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Page Number Controls */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Selecionar Página do Dia</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateBriefingConfig({ pdfPageNumber: Math.max(1, pdfPageNumber - 1) })
                  }
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] rounded-xl font-black text-xs cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 bg-blue-600 text-white font-black rounded-xl text-xs">
                  Pág {pdfPageNumber}
                </span>
                <button
                  onClick={() =>
                    updateBriefingConfig({ pdfPageNumber: pdfPageNumber + 1 })
                  }
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] rounded-xl font-black text-xs cursor-pointer"
                >
                  +
                </button>

                {/* Quick Page Jump Pills */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[1, 2, 3, 4, 5].map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => updateBriefingConfig({ pdfPageNumber: pageNum })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                        pdfPageNumber === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Direct Slide Image Fallback */}
          <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[var(--muted)]">
              Alternativa: Prefere enviar uma foto/imagem da folha do informativo direto do computador?
            </span>
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-[var(--bg)] hover:bg-[var(--line)] border border-[var(--line)] rounded-xl text-[11px] font-bold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>{isUploadingSlideImage ? 'Carregando...' : 'Upload da Imagem do Slide'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlideImageUpload}
                  className="hidden"
                />
              </label>

              {pdfDirectImageUrl && (
                <button
                  onClick={() => updateBriefingConfig({ pdfDirectImageUrl: '' })}
                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black cursor-pointer"
                >
                  Remover Imagem
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCESS KNOWLEDGE CONTROLS */}
      {activeTab === 'process' && (
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevProcess}
                className="p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] font-black rounded-xl cursor-pointer"
                title="Processo Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 rounded-xl font-extrabold">
                Card {activeProcessIndex + 1} de {filteredProcessList.length}
              </span>

              <button
                onClick={handleNextProcess}
                className="p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] font-black rounded-xl cursor-pointer"
                title="Próximo Processo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleRandomProcess}
                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] font-extrabold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-600" />
                <span>Aleatório</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddProcessModal}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Card de Processo</span>
              </button>

              {currentProcess && (
                <button
                  onClick={() => handleOpenEditProcessModal(currentProcess)}
                  className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Editar Card Atual</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <MultiSelectFilter
              label="Filtrar Categoria do Processo"
              options={processCategoryOptions}
              selectedValues={selectedProcessCategories}
              onChange={setSelectedProcessCategories}
              placeholder="Todas as categorias"
              allLabel="Todas as Categorias"
              icon={<Tag className="w-3 h-3 text-purple-500" />}
            />
            <MultiSelectFilter
              label="Filtrar Tipo do Processo"
              options={processTypeOptions}
              selectedValues={selectedProcessTypes}
              onChange={setSelectedProcessTypes}
              placeholder="Todos os tipos"
              allLabel="Todos os Tipos"
              icon={<Sparkles className="w-3 h-3 text-purple-500" />}
            />
          </div>
        </div>
      )}

      {/* TAB 4: SCALE SLIDE CONTROLS */}
      {activeTab === 'scale' && (
        <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-2xl shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end">
            <MultiSelectFilter
              label="Cargo"
              options={roleOptions}
              selectedValues={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Todos os cargos"
              allLabel="Todos os Cargos"
              icon={<Briefcase className="w-3 h-3 text-[var(--primary)]" />}
            />

            <MultiSelectFilter
              label="Categoria"
              options={categoryOptions}
              selectedValues={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Todas as categorias"
              allLabel="Todas as Categorias"
              icon={<Tag className="w-3 h-3 text-[var(--primary)]" />}
            />

            <MultiSelectFilter
              label="Time / TL"
              options={tlOptions}
              selectedValues={selectedTLs}
              onChange={setSelectedTLs}
              placeholder="Todos os times"
              allLabel="Todos os Times"
              icon={<Users className="w-3 h-3 text-[var(--primary)]" />}
            />

            <div className="flex flex-col gap-1">
              <label className="block text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--primary)]" />
                <span>Exibição de Refeição</span>
              </label>
              <button
                onClick={() => setShowIntervals(!showIntervals)}
                className={`w-full px-3 py-2 rounded-xl font-bold text-xs border cursor-pointer transition-colors ${
                  showIntervals
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300'
                    : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--line)]'
                }`}
              >
                {showIntervals ? 'Horários Visíveis' : 'Horários Ocultos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Q&A / PERGUNTAS CONTROLS */}
      {activeTab === 'qa' && (
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h4 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>Gerenciar Perguntas & Dúvidas do Slide 5</span>
            </h4>
            <span className="text-[10px] font-bold text-[var(--muted)]">
              {qaQuestions.length} perguntas cadastradas
            </span>
          </div>

          <div className="space-y-3">
            {/* Add New Question Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newQaInput}
                onChange={(e) => setNewQaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newQaInput.trim()) {
                    const updated = [...qaQuestions, newQaInput.trim()];
                    setQaQuestions(updated);
                    updateBriefingConfig({ qaQuestions: updated });
                    setNewQaInput('');
                    showNotice('Nova pergunta adicionada ao Slide 5!');
                  }
                }}
                placeholder="Digite uma nova pergunta para a equipe (pressione Enter ou clique em Adicionar)..."
                className="flex-1 p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-xs text-[var(--ink)] focus:border-purple-500"
              />
              <button
                onClick={() => {
                  if (!newQaInput.trim()) return;
                  const updated = [...qaQuestions, newQaInput.trim()];
                  setQaQuestions(updated);
                  updateBriefingConfig({ qaQuestions: updated });
                  setNewQaInput('');
                  showNotice('Nova pergunta adicionada ao Slide 5!');
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* List of active Q&A Questions */}
            <div className="space-y-1.5">
              {qaQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--ink)]"
                >
                  <span className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-900 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{q}</span>
                  </span>
                  <button
                    onClick={() => {
                      const updated = qaQuestions.filter((_, i) => i !== idx);
                      setQaQuestions(updated);
                      updateBriefingConfig({ qaQuestions: updated });
                      showNotice('Pergunta removida.');
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                    title="Excluir Pergunta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SINGLE SLIDE PREVIEW IN CANVAS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-2 font-extrabold text-[var(--muted)]">
          <span>Pré-visualização do Slide Selecionado:</span>
          <span className="uppercase text-[var(--primary)] font-black">
            {activeTab === 'cover' && 'Slide 1: Capa'}
            {activeTab === 'operational_pdf' && 'Slide 2: Informativo Operacional'}
            {activeTab === 'process' && 'Slide 3: Reforço de Processo'}
            {activeTab === 'scale' && 'Slide 4: Escala e Dimensionamento'}
            {activeTab === 'qa' && 'Slide 5: Perguntas & Dúvidas'}
          </span>
        </div>

        {activeTab === 'cover' && renderSlideContent(1)}
        {activeTab === 'operational_pdf' && renderSlideContent(2)}
        {activeTab === 'process' && renderSlideContent(3)}
        {activeTab === 'scale' && renderSlideContent(4)}
        {activeTab === 'qa' && renderSlideContent(5)}
      </div>

      {/* FULL PRESENTATION INTERACTIVE MODAL (MODO TV FULLSCREEN) */}
      <AnimatePresence>
        {isPresentationMode && (
          <motion.div
            ref={presentationContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 overflow-hidden"
          >
            {/* Top Bar Navigation Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <Play className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Modo Apresentação do Briefing
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Use as setas do teclado (← / →) para navegar ou clique nos botões abaixo
                  </p>
                </div>
              </div>

              {/* Slide Indicator Tabs & Fullscreen Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPresentationSlide(1)}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      presentationSlide === 1 ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Capa
                  </button>
                  <button
                    onClick={() => setPresentationSlide(2)}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      presentationSlide === 2 ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Informativo
                  </button>
                  <button
                    onClick={() => setPresentationSlide(3)}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      presentationSlide === 3 ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Processo
                  </button>
                  <button
                    onClick={() => setPresentationSlide(4)}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      presentationSlide === 4 ? 'bg-indigo-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4. Escala
                  </button>
                  <button
                    onClick={() => setPresentationSlide(5)}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      presentationSlide === 5 ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    5. Dúvidas
                  </button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                  title="Alternar Tela Cheia"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </button>

                <button
                  onClick={() => setIsPresentationMode(false)}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Sair (Esc)</span>
                </button>
              </div>
            </div>

            {/* Slide Stage Container */}
            <div className="my-auto w-full max-w-6xl mx-auto py-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={presentationSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderSlideContent(presentationSlide)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 z-10">
              <button
                disabled={presentationSlide === 1}
                onClick={() =>
                  setPresentationSlide((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : 1))
                }
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Slide Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPresentationSlide(s as 1 | 2 | 3 | 4 | 5)}
                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                      presentationSlide === s ? 'bg-emerald-400 scale-125' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={presentationSlide === 5}
                onClick={() =>
                  setPresentationSlide((prev) => (prev < 5 ? ((prev + 1) as 1 | 2 | 3 | 4 | 5) : 5))
                }
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>Próximo Slide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROCESS KNOWLEDGE MANAGEMENT MODAL */}
      <AnimatePresence>
        {isManageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[var(--paper)] border border-[var(--line)] rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h3 className="text-base font-black text-[var(--ink)] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span>{editingProcessId ? 'Editar Card de Processo' : 'Cadastrar Novo Card de Processo'}</span>
                </h3>
                <button
                  onClick={() => setIsManageModalOpen(false)}
                  className="p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Título do Processo / Procedimento
                  </label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Ex: Padrão de Bipagem & Conferência de Volumes"
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                      Tipo de Conteúdo
                    </label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as ProcessType)}
                      className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs cursor-pointer focus:border-purple-600"
                    >
                      <option value="explicacao">Explicação do Processo</option>
                      <option value="procedimento">Procedimento Padrão (SOP)</option>
                      <option value="seguranca">Segurança do Trabalho</option>
                      <option value="qualidade">Conformidade & Qualidade</option>
                      <option value="caracteristica">Característica do Processo</option>
                      <option value="curiosidade">Curiosidade Operacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                      Setor / Categoria
                    </label>
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      placeholder="Ex: Recebimento, Expedição, ICQA"
                      className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Descrição Detalhada do Processo
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="Explique detalhadamente a regra do processo, orientação ou instrução operacional..."
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-medium text-[var(--ink)] text-xs focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                    Pontos-Chave / Regras de Ouro (Um por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={keyTakeawaysInput}
                    onChange={(e) => setKeyTakeawaysInput(e.target.value)}
                    placeholder="Sempre valide a etiqueta antes de fechar a caixa&#10;Mantenha a postura ereta na paletização&#10;Comunique o time em caso de divergência"
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-medium text-[var(--ink)] text-xs focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider block mb-1">
                    URL da Imagem Ilustrativa (Opcional)
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
                {editingProcessId && (
                  <button
                    onClick={() => {
                      if (confirm('Deseja excluir este card de processo?')) {
                        deleteProcessKnowledge(editingProcessId);
                        setIsManageModalOpen(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black cursor-pointer hover:bg-rose-100"
                  >
                    Excluir Card
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setIsManageModalOpen(false)}
                    className="px-4 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--ink)] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProcess}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                  >
                    Salvar Card
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
