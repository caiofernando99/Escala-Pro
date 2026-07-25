import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import {
  UserPlus,
  Upload,
  Calendar,
  Plus,
  Trash2,
  Palmtree,
  Stethoscope,
  BookOpen,
  Briefcase,
  Tag,
  Clock,
  Sparkles,
  X,
  RotateCcw,
  Users,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { ShiftGroup, ScheduledAbsence, AbsenceType } from '../types';
import * as XLSX from 'xlsx';
import { matchesSearch } from '../utils/helpers';

const SHIFT_GROUPS: ShiftGroup[] = ['A', 'B', 'C', 'D'];
const TEAM_SHIFTS = ['T1', 'T2', 'T3', 'T4', 'T5', 'Manhã', 'Tarde', 'Noite', 'Geral'];

export const TeamView: React.FC = () => {
  const {
    state,
    setTeamInfo,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    restoreCollaborator,
    permanentlyDeleteCollaborator,
    clearTrashBin,
    addScheduledAbsence,
    removeScheduledAbsence,
    addTask,
    updateTask,
    deleteTask,
    addBreakSlot,
    updateBreakSlot,
    deleteBreakSlot,
    addCatalogItem,
    removeCatalogItem,
    setSkillLevel,
    importRosterRows,
    showNotice,
    addTeamLeader,
    removeTeamLeader,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('todos');
  const [selectedTLFilter, setSelectedTLFilter] = useState<string>('todos');
  const [newTLInput, setNewTLInput] = useState<string>('');
  const [listMode, setListMode] = useState<'active' | 'trash'>('active');
  const [confirmDeletePermanentId, setConfirmDeletePermanentId] = useState<string | null>(null);
  const [confirmClearTrash, setConfirmClearTrash] = useState(false);

  // Catalog inputs
  const [newRole, setNewRole] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // New task input
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskRoles, setNewTaskRoles] = useState<string[]>([]);
  const [newTaskCategories, setNewTaskCategories] = useState<string[]>([]);

  // New break input
  const [newBreakTime, setNewBreakTime] = useState('20:00');

  // Absence registration modal state
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceColId, setAbsenceColId] = useState<string>('');
  const [absenceType, setAbsenceType] = useState<AbsenceType>('ferias');
  const [absenceStartDate, setAbsenceStartDate] = useState(state.selectedDate);
  const [absenceEndDate, setAbsenceEndDate] = useState(state.selectedDate);
  const [absenceNotes, setAbsenceNotes] = useState('');

  // Skill assignment modal state
  const [addSkillModalCollabId, setAddSkillModalCollabId] = useState<string | null>(null);
  const [selectedSkillName, setSelectedSkillName] = useState<string>('');
  const [isCustomSkill, setIsCustomSkill] = useState<boolean>(false);
  const [customSkillName, setCustomSkillName] = useState<string>('');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<number>(1);

  // Available unique shifts for filtering
  const defaultShifts = ['Geral', 'T1', 'T2', 'T3', 'T4', 'T5'];
  const colShifts = state.collaborators.map((c) => c.shift || 'Geral');
  const availableShifts = Array.from(new Set([...defaultShifts, ...colShifts]));

  // TLs available for the selected shift
  const tlsForSelectedShift = Array.from(
    new Set(
      state.collaborators
        .filter((c) => selectedShiftFilter === 'todos' || (c.shift || 'Geral') === selectedShiftFilter)
        .map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time')
    )
  );

  // Filtered collaborators
  const filteredCollaborators = state.collaborators.filter((c) => {
    const colTL = c.teamLeader || state.defaultTeamLeader || 'Sem Time';
    const matchesTL = selectedTLFilter === 'todos' || colTL === selectedTLFilter;
    const colShift = c.shift || 'Geral';
    const matchesShift = selectedShiftFilter === 'todos' || colShift === selectedShiftFilter;

    const matchesSearchTerm =
      matchesSearch(c.name, searchTerm) ||
      matchesSearch(c.login, searchTerm) ||
      matchesSearch(c.registration, searchTerm) ||
      matchesSearch(c.role, searchTerm) ||
      matchesSearch(c.category, searchTerm) ||
      matchesSearch(colShift, searchTerm) ||
      matchesSearch(colTL, searchTerm);

    return matchesTL && matchesShift && matchesSearchTerm;
  });

  // Filtered deleted collaborators (Trash Bin)
  const deletedList = state.deletedCollaborators || [];
  const filteredDeletedCollaborators = deletedList.filter((d) => {
    const col = d.collaborator;
    const colTL = col.teamLeader || state.defaultTeamLeader || 'Sem Time';
    const matchesTL = selectedTLFilter === 'todos' || colTL === selectedTLFilter;

    const matchesSearchTerm =
      matchesSearch(col.name, searchTerm) ||
      matchesSearch(col.login, searchTerm) ||
      matchesSearch(col.registration, searchTerm) ||
      matchesSearch(col.role, searchTerm) ||
      matchesSearch(col.category, searchTerm) ||
      matchesSearch(colTL, searchTerm);

    return matchesTL && matchesSearchTerm;
  });

  const getDaysRemaining = (expiresAtStr?: string) => {
    if (!expiresAtStr) return '60 dias restantes';
    try {
      const expires = new Date(expiresAtStr).getTime();
      const now = new Date().getTime();
      const diffMs = expires - now;
      if (diffMs <= 0) return 'Expirando hoje';
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    } catch {
      return '60 dias restantes';
    }
  };

  const formatISOToBR = (isoStr?: string) => {
    if (!isoStr) return 'Recente';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const count = importRosterRows(json);
        if (count === 0) {
          showNotice('Nenhum registro válido encontrado no arquivo.');
        }
      } catch (err) {
        showNotice('Erro ao ler a planilha. Verifique se é um arquivo Excel ou CSV válido.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSaveAbsence = () => {
    if (!absenceColId) {
      showNotice('Selecione um colaborador.');
      return;
    }
    if (!absenceStartDate || !absenceEndDate) {
      showNotice('Selecione as datas de início e término.');
      return;
    }
    if (absenceEndDate < absenceStartDate) {
      showNotice('A data de término deve ser igual ou posterior à data de início.');
      return;
    }

    addScheduledAbsence(absenceColId, {
      type: absenceType,
      startDate: absenceStartDate,
      endDate: absenceEndDate,
      notes: absenceNotes,
    });

    setAbsenceModalOpen(false);
    setAbsenceNotes('');
  };

  const handleAddSkillToCollab = () => {
    if (!addSkillModalCollabId) return;
    const finalSkillName = isCustomSkill ? customSkillName.trim() : selectedSkillName.trim();
    if (!finalSkillName) {
      showNotice('Por favor, informe ou selecione uma skill.');
      return;
    }

    if (isCustomSkill) {
      addCatalogItem('skills', finalSkillName);
    }

    setSkillLevel(addSkillModalCollabId, finalSkillName, selectedSkillLevel);
    setAddSkillModalCollabId(null);
    setSelectedSkillName('');
    setCustomSkillName('');
    setIsCustomSkill(false);
    setSelectedSkillLevel(1);
    showNotice(`Skill "${finalSkillName}" (Nível ${selectedSkillLevel}) vinculada.`);
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;
    addTask(newTaskName, newTaskRoles, newTaskCategories);
    setNewTaskName('');
    setNewTaskRoles([]);
    setNewTaskCategories([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Gestão de Equipe, Cargos e Tarefas</h3>
          <p className="text-xs text-[var(--muted)]">
            Cadastre a equipe, vincule tarefas aos cargos/categorias e gerencie férias, licenças e treinamentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-[var(--bg)] flex items-center gap-1.5 text-[var(--ink)] transition-colors">
            <Upload className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Importar Planilha</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => setAbsenceModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Palmtree className="w-3.5 h-3.5" />
            <span>+ Agendar Férias / Licença</span>
          </button>
          <button
            onClick={() => addCollaborator()}
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Colaborador</span>
          </button>
        </div>
      </div>

      {/* Team Identification */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[var(--primary)]" />
              <span>Identificação da Gestão, Turno e Team Leaders (Times)</span>
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Separe a operação em múltiplos times (por Team Leader) em cada turno. Assim, a mesma planilha online atende todos os times do setor com organização perfeita.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">Nome da Operação / Equipe</label>
            <input
              type="text"
              value={state.teamName}
              onChange={(e) => setTeamInfo({ teamName: e.target.value })}
              placeholder="Ex.: Operação Logística"
              className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">Setor / Departamento</label>
            <input
              type="text"
              value={state.sector}
              onChange={(e) => setTeamInfo({ sector: e.target.value })}
              placeholder="Ex.: Recebimento & Expedição"
              className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">Gestor(a) Responsável</label>
            <input
              type="text"
              value={state.manager}
              onChange={(e) => setTeamInfo({ manager: e.target.value })}
              placeholder="Ex.: Carlos Santos"
              className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">Turno Padrão da Operação</label>
            <select
              value={state.teamShift}
              onChange={(e) => setTeamInfo({ teamShift: e.target.value })}
              className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-bold text-[var(--ink)]"
            >
              <option value="">Selecione o turno</option>
              {TEAM_SHIFTS.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Leaders (Times) Management Row */}
        <div className="pt-3 border-t border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Team Leaders & Times Cadastrados no Turno:
            </span>
            <span className="text-[11px] font-medium text-[var(--muted)]">
              {(state.teamLeaders || []).length} Times no Turno {state.teamShift || 'T2'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(state.teamLeaders || []).map((tl) => (
              <span
                key={tl}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-extrabold shadow-2xs"
              >
                <span>{tl}</span>
                <button
                  onClick={() => removeTeamLeader(tl)}
                  className="hover:text-red-600 transition-colors p-0.5"
                  title="Remover este Time / TL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-md pt-1">
            <input
              type="text"
              value={newTLInput}
              onChange={(e) => setNewTLInput(e.target.value)}
              placeholder="Ex: Time do TL Bruno, Time da TL Ana..."
              className="flex-1 p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-xs font-semibold text-[var(--ink)]"
            />
            <button
              onClick={() => {
                if (newTLInput.trim()) {
                  addTeamLeader(newTLInput.trim());
                  setNewTLInput('');
                }
              }}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Time/TL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roles, Categories, Skills Catalogs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cargos */}
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Cargos</span>
            </h4>
            <span className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded font-mono font-bold text-[var(--muted)]">
              {state.roles.length}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Novo cargo..."
              className="flex-1 p-1.5 text-xs bg-[var(--bg)] border border-[var(--line)] rounded-lg"
            />
            <button
              onClick={() => {
                addCatalogItem('roles', newRole);
                setNewRole('');
              }}
              className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {state.roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary-soft)] text-[var(--primary)] rounded-md text-xs font-semibold"
              >
                <span>{r}</span>
                <button onClick={() => removeCatalogItem('roles', r)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Categorias</span>
            </h4>
            <span className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded font-mono font-bold text-[var(--muted)]">
              {state.categories.length}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 p-1.5 text-xs bg-[var(--bg)] border border-[var(--line)] rounded-lg"
            />
            <button
              onClick={() => {
                addCatalogItem('categories', newCategory);
                setNewCategory('');
              }}
              className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {state.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded-md text-xs font-semibold"
              >
                <span>{cat}</span>
                <button onClick={() => removeCatalogItem('categories', cat)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Skills & Proficiências</span>
            </h4>
            <span className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded font-mono font-bold text-[var(--muted)]">
              {state.skills.length}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Nova skill..."
              className="flex-1 p-1.5 text-xs bg-[var(--bg)] border border-[var(--line)] rounded-lg"
            />
            <button
              onClick={() => {
                addCatalogItem('skills', newSkill);
                setNewSkill('');
              }}
              className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {state.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded-md text-xs font-semibold"
              >
                <span>{s}</span>
                <button onClick={() => removeCatalogItem('skills', s)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Task Management Linked to Roles & Categories */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--ink)]">Relacionamento de Tarefas com Cargo e Categoria</h4>
            <p className="text-xs text-[var(--muted)]">
              Relacione quais cargos e categorias realizam cada tarefa para filtragem e dimensionamento automático.
            </p>
          </div>
        </div>

        {/* Task Creation Form */}
        <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--line)] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Nome da nova tarefa (ex: Conferencia ICQA)..."
              className="flex-1 p-2 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] font-semibold"
            />
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Tarefa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-bold text-[var(--muted)] block mb-1">Cargos Permitidos/Recomendados:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-[var(--paper)] p-2 rounded-lg border border-[var(--line)]">
                {state.roles.map((r) => {
                  const checked = newTaskRoles.includes(r);
                  return (
                    <label key={r} className="inline-flex items-center gap-1.5 cursor-pointer bg-[var(--bg)] px-2 py-1 rounded text-[11px] font-medium">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setNewTaskRoles([...newTaskRoles, r]);
                          else setNewTaskRoles(newTaskRoles.filter((item) => item !== r));
                        }}
                        className="rounded"
                      />
                      <span>{r}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-bold text-[var(--muted)] block mb-1">Categorias Permitidas/Recomendadas:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-[var(--paper)] p-2 rounded-lg border border-[var(--line)]">
                {state.categories.map((cat) => {
                  const checked = newTaskCategories.includes(cat);
                  return (
                    <label key={cat} className="inline-flex items-center gap-1.5 cursor-pointer bg-[var(--bg)] px-2 py-1 rounded text-[11px] font-medium">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setNewTaskCategories([...newTaskCategories, cat]);
                          else setNewTaskCategories(newTaskCategories.filter((item) => item !== cat));
                        }}
                        className="rounded"
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase">
                <th className="p-2.5">Nome da Tarefa</th>
                <th className="p-2.5">Cargos Vinculados</th>
                <th className="p-2.5">Categorias Vinculadas</th>
                <th className="p-2.5 text-center">Membros</th>
                <th className="p-2.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {state.tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[var(--bg)]">
                  <td className="p-2.5 font-bold text-[var(--ink)]">
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateTask(task.id, { name: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--primary)] px-1 py-0.5 w-full font-semibold"
                    />
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(task.allowedRoles || []).length > 0 ? (
                        task.allowedRoles?.map((r) => (
                          <span key={r} className="px-1.5 py-0.5 bg-[var(--primary-soft)] text-[var(--primary)] rounded text-[10px] font-bold">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--muted)] italic">Todos os cargos</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(task.allowedCategories || []).length > 0 ? (
                        task.allowedCategories?.map((c) => (
                          <span key={c} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded text-[10px] font-bold">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--muted)] italic">Todas as categorias</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-bold text-[var(--ink)]">{task.members.length}</td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break Slots Configuration */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--primary)]" />
          <span>Horários de Intervalo para Refeição</span>
        </h4>

        <div className="flex flex-wrap items-center gap-3 bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)]">
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">Horário:</label>
            <input
              type="time"
              value={newBreakTime}
              onChange={(e) => setNewBreakTime(e.target.value)}
              className="p-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-sm font-bold"
            />
          </div>
          <button
            onClick={() => {
              addBreakSlot(newBreakTime);
            }}
            className="mt-5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Horário</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {state.breaks.map((b) => (
            <div
              key={b.id}
              className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-black text-[var(--ink)]">{b.time}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Sem limite</div>
              </div>
              <button
                onClick={() => deleteBreakSlot(b.id)}
                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                title="Excluir Horário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Roster Table with SEARCH BAR, Tabs & Trash Bin */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
        {/* Top View Mode Switcher & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setListMode('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                listMode === 'active'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Colaboradores Ativos ({state.collaborators.length})</span>
            </button>
            <button
              onClick={() => setListMode('trash')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                listMode === 'trash'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-amber-600'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Lixeira / Excluídos (Guardados 60d)</span>
              {deletedList.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    listMode === 'trash' ? 'bg-white text-amber-900' : 'bg-amber-500 text-white'
                  }`}
                >
                  {deletedList.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Turno Filter Pill */}
            <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--line)] p-1 rounded-lg text-xs font-semibold">
              <span className="text-[var(--muted)] px-2 font-bold">Turno:</span>
              <select
                value={selectedShiftFilter}
                onChange={(e) => {
                  setSelectedShiftFilter(e.target.value);
                  setSelectedTLFilter('todos');
                }}
                className="bg-transparent text-[var(--ink)] font-bold focus:outline-none cursor-pointer py-1 pr-1"
              >
                <option value="todos">Todos os Turnos</option>
                {availableShifts.map((s) => (
                  <option key={s} value={s}>
                    Turno {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Leader Filter Pill */}
            <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--line)] p-1 rounded-lg text-xs font-semibold">
              <span className="text-[var(--muted)] px-2 font-bold">Time / TL:</span>
              <select
                value={selectedTLFilter}
                onChange={(e) => setSelectedTLFilter(e.target.value)}
                className="bg-transparent text-[var(--ink)] font-bold focus:outline-none cursor-pointer py-1 pr-1"
              >
                <option value="todos">
                  {selectedShiftFilter !== 'todos' ? `Todos os Times do Turno ${selectedShiftFilter}` : 'Todos os Times'}
                </option>
                {(selectedShiftFilter === 'todos' ? (state.teamLeaders || []) : tlsForSelectedShift).map((tl) => (
                  <option key={tl} value={tl}>
                    {tl}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input Requirement */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Pesquisar por nome, login, cargo, time..."
              className="w-full sm:w-64"
            />

            {listMode === 'trash' && deletedList.length > 0 && (
              <button
                onClick={() => setConfirmClearTrash(true)}
                className="px-3 py-2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 border border-red-300 dark:border-red-800 text-xs font-extrabold rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="Limpar todos os colaboradores da lixeira"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Esvaziar Lixeira</span>
              </button>
            )}
          </div>
        </div>

        {listMode === 'active' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase">
                <th className="p-2">Nome</th>
                <th className="p-2">Login / Reg.</th>
                <th className="p-2">Turno & Time / TL</th>
                <th className="p-2">Escala</th>
                <th className="p-2">Cargo</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Skills & Nível</th>
                <th className="p-2">Férias / Licenças / Treinamentos</th>
                <th className="p-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filteredCollaborators.length > 0 ? (
                filteredCollaborators.map((c) => {
                  const activeAbsences = c.absences || [];
                  const colTL = c.teamLeader || state.defaultTeamLeader || 'Sem Time';
                  return (
                    <tr key={c.id} className="hover:bg-[var(--bg)] transition-colors">
                      {/* Nome */}
                      <td className="p-2 font-bold text-[var(--ink)] min-w-[160px]">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateCollaborator(c.id, { name: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--primary)] px-1 py-0.5 w-full font-bold"
                        />
                      </td>

                      {/* Login & Reg */}
                      <td className="p-2 min-w-[130px]">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={c.login || ''}
                            placeholder="Login"
                            onChange={(e) => updateCollaborator(c.id, { login: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--primary)] px-1 py-0.5 w-full text-[11px]"
                          />
                          <input
                            type="text"
                            value={c.registration || ''}
                            placeholder="Matrícula"
                            onChange={(e) => updateCollaborator(c.id, { registration: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-[var(--line)] focus:border-[var(--primary)] px-1 py-0.5 w-full text-[11px] text-[var(--muted)]"
                          />
                        </div>
                      </td>

                      {/* Turno & Time / TL */}
                      <td className="p-2 min-w-[170px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-[var(--muted)]">Turno:</span>
                            <select
                              value={c.shift || 'Geral'}
                              onChange={(e) => updateCollaborator(c.id, { shift: e.target.value })}
                              className="bg-[var(--bg)] border border-[var(--line)] rounded px-1.5 py-0.5 text-[11px] font-black text-[var(--primary)] w-full cursor-pointer"
                            >
                              {availableShifts.map((s) => (
                                <option key={s} value={s}>
                                  Turno {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-[var(--muted)]">TL:</span>
                            <select
                              value={colTL}
                              onChange={(e) => updateCollaborator(c.id, { teamLeader: e.target.value })}
                              className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded px-1.5 py-0.5 font-extrabold text-[11px] text-emerald-950 dark:text-emerald-200 w-full cursor-pointer"
                            >
                              {(state.teamLeaders || []).map((tl) => (
                                <option key={tl} value={tl}>
                                  {tl}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Escala 6x2 */}
                      <td className="p-2 min-w-[70px]">
                        <select
                          value={c.scale}
                          onChange={(e) => updateCollaborator(c.id, { scale: e.target.value as ShiftGroup })}
                          className="bg-[var(--bg)] border border-[var(--line)] rounded p-1 font-bold text-xs"
                        >
                          {SHIFT_GROUPS.map((grp) => (
                            <option key={grp} value={grp}>
                              Turma {grp}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Cargo */}
                      <td className="p-2 min-w-[130px]">
                        <select
                          value={c.role}
                          onChange={(e) => updateCollaborator(c.id, { role: e.target.value })}
                          className="bg-[var(--bg)] border border-[var(--line)] rounded p-1 font-semibold text-xs w-full"
                        >
                          <option value="">Selecione Cargo</option>
                          {state.roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Categoria */}
                      <td className="p-2 min-w-[130px]">
                        <select
                          value={c.category}
                          onChange={(e) => updateCollaborator(c.id, { category: e.target.value })}
                          className="bg-[var(--bg)] border border-[var(--line)] rounded p-1 font-semibold text-xs w-full"
                        >
                          <option value="">Selecione Categoria</option>
                          {state.categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Skills & Nível */}
                      <td className="p-2 min-w-[200px]">
                        {(() => {
                          const activeSkills = Object.entries(c.skills || {}).filter(([_, lvl]) => Number(lvl) > 0);
                          return (
                            <div className="space-y-1.5">
                              {activeSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                                  {activeSkills.map(([sName, lvlVal]) => {
                                    const lvl = Number(lvlVal);
                                    const badgeColor =
                                      lvl === 1
                                        ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800'
                                        : lvl === 2
                                        ? 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-800'
                                        : 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800';

                                    return (
                                      <div
                                        key={sName}
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-extrabold shadow-2xs ${badgeColor}`}
                                      >
                                        <Sparkles className="w-3 h-3 shrink-0 opacity-80" />
                                        <span className="truncate max-w-[100px]">{sName}</span>
                                        <select
                                          value={lvl}
                                          onChange={(e) => setSkillLevel(c.id, sName, Number(e.target.value))}
                                          className="bg-black/10 dark:bg-white/10 text-inherit border-none rounded px-1 py-0 text-[10px] font-black cursor-pointer focus:outline-none"
                                          title="Mudar nível da skill"
                                        >
                                          <option value={1}>Nv 1 (Básico)</option>
                                          <option value={2}>Nv 2 (Médio)</option>
                                          <option value={3}>Nv 3 (Sênior)</option>
                                        </select>
                                        <button
                                          onClick={() => setSkillLevel(c.id, sName, 0)}
                                          className="p-0.5 hover:text-red-600 transition-colors rounded ml-0.5"
                                          title="Remover skill"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-[11px] text-[var(--muted)] italic">Nenhuma skill vinculada</div>
                              )}

                              <button
                                onClick={() => {
                                  setAddSkillModalCollabId(c.id);
                                  const unassigned = state.skills.find((s) => !(c.skills?.[s] && c.skills[s] > 0));
                                  setSelectedSkillName(unassigned || state.skills[0] || '');
                                  setIsCustomSkill(false);
                                  setCustomSkillName('');
                                  setSelectedSkillLevel(1);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--primary)] hover:bg-[var(--primary-soft)] px-2.5 py-1 rounded-md border border-dashed border-[var(--primary-border)] transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Adicionar Skill</span>
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Férias / Licenças / Treinamentos List */}
                      <td className="p-2 min-w-[200px]">
                        <div className="space-y-1.5">
                          {activeAbsences.length > 0 ? (
                            activeAbsences.map((abs) => {
                              const badgeColor =
                                abs.type === 'ferias'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200'
                                  : abs.type === 'licenca'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                  : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200';

                              return (
                                <div
                                  key={abs.id}
                                  className={`flex items-center justify-between p-1.5 rounded border text-[11px] font-semibold ${badgeColor}`}
                                >
                                  <div>
                                    <span className="capitalize font-bold">{abs.type}:</span>{' '}
                                    <span>
                                      {abs.startDate} até {abs.endDate}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeScheduledAbsence(c.id, abs.id)}
                                    className="p-0.5 hover:text-red-600 ml-1"
                                    title="Remover afastamento"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[var(--muted)] text-[11px] italic">Nenhum agendamento</span>
                          )}
                          <button
                            onClick={() => {
                              setAbsenceColId(c.id);
                              setAbsenceModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Agendar Período</span>
                          </button>
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td className="p-2 text-right">
                        <button
                          onClick={() => deleteCollaborator(c.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          title="Excluir colaborador (mover para a lixeira)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[var(--muted)]">
                    Nenhum colaborador ativo encontrado com o termo da pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        ) : (
          /* Trash Bin Table View */
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong className="font-extrabold block mb-0.5 text-sm">
                  Lixeira de Segurança (Retenção de 60 dias)
                </strong>
                Ao excluir um colaborador da lista de ativos, os dados são guardados de forma segura nesta lixeira por até 60 dias. Você pode restaurá-lo a qualquer momento com 1 clique ou excluir definitivamente se desejar.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Login / Reg.</th>
                    <th className="p-2">Time / TL</th>
                    <th className="p-2">Cargo & Escala</th>
                    <th className="p-2">Data da Exclusão</th>
                    <th className="p-2">Prazo para Exclusão Permanente</th>
                    <th className="p-2 text-right">Ações de Recuperação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredDeletedCollaborators.length > 0 ? (
                    filteredDeletedCollaborators.map((item) => {
                      const c = item.collaborator;
                      const colTL = c.teamLeader || state.defaultTeamLeader || 'Sem Time';
                      return (
                        <tr key={item.id} className="hover:bg-[var(--bg)] transition-colors">
                          <td className="p-2 font-bold text-[var(--ink)]">
                            {c.name}
                          </td>
                          <td className="p-2 text-[var(--muted)]">
                            <div>{c.login || '—'}</div>
                            <div className="text-[10px]">{c.registration || '—'}</div>
                          </td>
                          <td className="p-2">
                            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-lg font-extrabold text-[11px]">
                              {colTL}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-[var(--ink)]">{c.role || 'Sem cargo'}</div>
                            <div className="text-[10px] text-[var(--muted)]">Escala {c.scale} ({c.shift || 'T2'})</div>
                          </td>
                          <td className="p-2 text-[var(--muted)] font-mono text-[11px]">
                            {formatISOToBR(item.deletedAt)}
                          </td>
                          <td className="p-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-800 rounded-lg text-[11px] font-black shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>{getDaysRemaining(item.expiresAt)}</span>
                            </span>
                          </td>
                          <td className="p-2 text-right space-x-2">
                            <button
                              onClick={() => restoreCollaborator(item.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Restaurar colaborador de volta para a equipe ativa"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => setConfirmDeletePermanentId(item.id)}
                              className="px-2.5 py-1.5 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Excluir permanentemente este colaborador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir Definitivo</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--muted)]">
                        Nenhum colaborador na lixeira.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Confirm Permanent Delete */}
      {confirmDeletePermanentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-[var(--ink)]">Excluir Permanentemente?</h3>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Esta ação removerá o colaborador definitivamente do sistema e não poderá ser desfeita. Tem certeza?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeletePermanentId(null)}
                className="px-4 py-2 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--paper)] text-xs font-bold rounded-lg text-[var(--ink)]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  permanentlyDeleteCollaborator(confirmDeletePermanentId);
                  setConfirmDeletePermanentId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow-2xs"
              >
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Clear Trash */}
      {confirmClearTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-[var(--ink)]">Esvaziar Lixeira Inteira?</h3>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Todos os colaboradores mantidos na lixeira serão apagados permanentemente. Esta ação é irreversível.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearTrash(false)}
                className="px-4 py-2 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--paper)] text-xs font-bold rounded-lg text-[var(--ink)]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearTrashBin();
                  setConfirmClearTrash(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow-2xs"
              >
                Esvaziar Lixeira Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vacation / Leave / Training Modal */}
      {absenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setAbsenceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Palmtree className="w-5 h-5 text-purple-600" />
              <span>Cadastrar Férias, Licença ou Treinamento</span>
            </h3>

            <p className="text-xs text-[var(--muted)]">
              Durante este período o colaborador é marcado com o status correto e <strong>não conta como ausente/falta</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Colaborador:</label>
                <select
                  value={absenceColId}
                  onChange={(e) => setAbsenceColId(e.target.value)}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
                >
                  <option value="">Selecione o colaborador...</option>
                  {state.collaborators.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.role || 'Sem cargo'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Tipo de Afastamento:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAbsenceType('ferias')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      absenceType === 'ferias'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]'
                    }`}
                  >
                    Férias
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbsenceType('licenca')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      absenceType === 'licenca'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]'
                    }`}
                  >
                    Licença
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbsenceType('treinamento')}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      absenceType === 'treinamento'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]'
                    }`}
                  >
                    Treinamento
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] mb-1">Data de Início:</label>
                  <input
                    type="date"
                    value={absenceStartDate}
                    onChange={(e) => setAbsenceStartDate(e.target.value)}
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] mb-1">Data de Término:</label>
                  <input
                    type="date"
                    value={absenceEndDate}
                    onChange={(e) => setAbsenceEndDate(e.target.value)}
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm font-semibold text-[var(--ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Observações (opcional):</label>
                <input
                  type="text"
                  value={absenceNotes}
                  onChange={(e) => setAbsenceNotes(e.target.value)}
                  placeholder="Ex: Férias regulamentares de 15 dias"
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-xs text-[var(--ink)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAbsenceModalOpen(false)}
                className="px-4 py-2 border border-[var(--line)] rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAbsence}
                className="px-5 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] shadow-xs"
              >
                Salvar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Add Skill to Collaborator */}
      {addSkillModalCollabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[var(--ink)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Adicionar Skill ao Colaborador</h3>
                  <p className="text-xs text-[var(--muted)]">
                    Colaborador:{' '}
                    <strong className="text-[var(--ink)]">
                      {state.collaborators.find((c) => c.id === addSkillModalCollabId)?.name}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAddSkillModalCollabId(null);
                  setSelectedSkillName('');
                  setCustomSkillName('');
                  setIsCustomSkill(false);
                }}
                className="p-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--muted)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Skill */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  Selecione a Skill / Habilidade:
                </label>
                <select
                  value={isCustomSkill ? '__custom__' : selectedSkillName}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomSkill(true);
                      setSelectedSkillName('');
                    } else {
                      setIsCustomSkill(false);
                      setSelectedSkillName(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">-- Selecione uma Skill do Catálogo --</option>
                  {state.skills.map((s) => {
                    const collab = state.collaborators.find((c) => c.id === addSkillModalCollabId);
                    const currentLvl = collab?.skills?.[s];
                    return (
                      <option key={s} value={s}>
                        {s} {currentLvl && currentLvl > 0 ? `(Já possui: Nv ${currentLvl})` : ''}
                      </option>
                    );
                  })}
                  <option value="__custom__">+ Outra skill (Criar nova skill)...</option>
                </select>
              </div>

              {/* If Custom Skill */}
              {isCustomSkill && (
                <div>
                  <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                    Nome da Nova Skill:
                  </label>
                  <input
                    type="text"
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    placeholder="Ex: Operador de Trator, Coletor de Dados..."
                    className="w-full p-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              )}

              {/* Level selection */}
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-2">
                  Nível de Proficiência / Experiência:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { level: 1, title: 'Nv 1 - Básico', desc: 'Iniciante / Treinamento' },
                    { level: 2, title: 'Nv 2 - Médio', desc: 'Pleno / Autônomo' },
                    { level: 3, title: 'Nv 3 - Avançado', desc: 'Especialista / Sênior' },
                  ].map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setSelectedSkillLevel(item.level)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        selectedSkillLevel === item.level
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-black shadow-xs'
                          : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[10px] opacity-80 font-normal mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                onClick={() => {
                  setAddSkillModalCollabId(null);
                  setSelectedSkillName('');
                  setCustomSkillName('');
                  setIsCustomSkill(false);
                }}
                className="px-4 py-2 border border-[var(--line)] rounded-xl text-xs font-bold hover:bg-[var(--bg)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSkillToCollab}
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vincular Skill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
