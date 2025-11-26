import React, { useEffect, useState } from 'react';
import { Search, Clock, AlertCircle, Plus, X, Edit2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ADMIN_PASSWORD = 'admin1234';

const formatPhoneNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const pad2 = (n) => String(n).padStart(2, '0');
const normalizePhoneDigits = (value) => (value || '').replace(/\D/g, '');

const normalizeDate = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
  }
  const str = String(value).trim();
  if (!str) return '';
  if (/^\d{8}$/.test(str)) return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  return str;
};

const normalizeTime = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return '';
    return `${pad2(parsed.H || 0)}:${pad2(parsed.M || 0)}`;
  }
  const str = String(value).trim();
  if (!str) return '';
  const match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match) return `${pad2(match[1])}:${match[2]}`;
  const d = new Date(`1970-01-01T${str}`);
  if (!isNaN(d.getTime())) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  return str;
};

export default function App() {
  const [route, setRoute] = useState(window.location.hash === '#/admin' ? 'admin' : 'search');
  const [applicants, setApplicants] = useState([]);
  const [searchForm, setSearchForm] = useState({ name: '', birthDate: '', phone: '' });
  const [searchResult, setSearchResult] = useState(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newApplicant, setNewApplicant] = useState({
    name: '',
    birthDate: '',
    phone: '',
    job: '',
    interviewDate: '',
    interviewTime: '',
    location: '',
    notes: ''
  });
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash === '#/admin' ? 'admin' : 'search');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        name: '김철수',
        birthDate: '1995-03-15',
        phone: '010-1234-5678',
        job: '프론트엔드 개발자',
        interviewDate: '2025-12-01',
        interviewTime: '10:00',
        location: '본사 3층 면접실 A',
        notes: '포트폴리오 및 자기소개서 지참'
      },
      {
        id: 2,
        name: '이영희',
        birthDate: '1998-07-22',
        phone: '010-2345-6789',
        job: '데이터 분석가',
        interviewDate: '2025-12-01',
        interviewTime: '14:00',
        location: '본사 3층 면접실 B',
        notes: '프레젠테이션 준비'
      }
    ];
    setApplicants(sampleData);
  }, []);

  useEffect(() => {
    if (route === 'admin' && !isAdminAuthenticated) {
      setShowAdminPassword(true);
    } else {
      setShowAdminPassword(false);
    }
  }, [route, isAdminAuthenticated]);

  const handleSearch = () => {
    const searchName = (searchForm.name || '').trim();
    const searchBirth = normalizeDate(searchForm.birthDate);
    const searchPhone = normalizePhoneDigits(searchForm.phone);

    const found = applicants.find(
      (app) =>
        (app.name || '').trim() === searchName &&
        normalizeDate(app.birthDate) === searchBirth &&
        normalizePhoneDigits(app.phone) === searchPhone
    );

    if (found) {
      setSearchResult(found);
    } else {
      setSearchResult('not_found');
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setShowAdminPassword(false);
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const resetNewApplicant = () => {
    setNewApplicant({
      name: '',
      birthDate: '',
      phone: '',
      job: '',
      interviewDate: '',
      interviewTime: '',
      location: '',
      notes: ''
    });
  };

  const handleAddApplicant = () => {
    if (
      !newApplicant.name ||
      !newApplicant.birthDate ||
      !newApplicant.phone ||
      !newApplicant.job ||
      !newApplicant.interviewDate ||
      !newApplicant.interviewTime ||
      !newApplicant.location
    ) {
      alert('필수 정보를 모두 입력해 주세요.');
      return;
    }
    const newId = Math.max(...applicants.map((a) => a.id), 0) + 1;
    setApplicants([...applicants, { ...newApplicant, id: newId }]);
    resetNewApplicant();
  };

  const handleDeleteApplicant = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setApplicants(applicants.filter((a) => a.id !== id));
    }
  };

  const handleEditApplicant = (applicant) => {
    setEditingId(applicant.id);
    setNewApplicant({ ...applicant });
  };

  const handleUpdateApplicant = () => {
    if (
      !newApplicant.name ||
      !newApplicant.birthDate ||
      !newApplicant.phone ||
      !newApplicant.job ||
      !newApplicant.interviewDate ||
      !newApplicant.interviewTime ||
      !newApplicant.location
    ) {
      alert('필수 정보를 모두 입력해 주세요.');
      return;
    }
    setApplicants(
      applicants.map((a) => (a.id === editingId ? { ...newApplicant, id: editingId } : a))
    );
    setEditingId(null);
    resetNewApplicant();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleTemplateDownload = () => {
    const rows = [
      [
        '이름',
        '생년월일(YYYY-MM-DD)',
        '연락처(숫자/하이픈 무관)',
        '직무',
        '면접일자(YYYY-MM-DD)',
        '면접시간(HH:MM)',
        '면접장소',
        '비고'
      ],
      ['김철수', '1995-03-15', '01012345678', '프론트엔드 개발자', '2025-12-01', '10:00', '본사 3층 면접실 A', '포트폴리오 지참'],
      ['이영희', '1998-07-22', '010-2345-6789', '데이터 분석가', '2025-12-01', '14:00', '본사 3층 면접실 B', '프레젠테이션 준비']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '면접일정');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interview-template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleXlsxUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const parsed = [];
        rows.forEach((row, idx) => {
          const name = String(row['이름'] || '').trim();
          const birthDate = normalizeDate(row['생년월일(YYYY-MM-DD)']);
          const phoneRaw = String(row['연락처(숫자/하이픈 무관)'] || '').trim();
          const job = String(row['직무'] || '').trim();
          const interviewDate = normalizeDate(row['면접일자(YYYY-MM-DD)']);
          const interviewTime = normalizeTime(row['면접시간(HH:MM)']);
          const location = String(row['면접장소'] || '').trim();
          const notes = String(row['비고'] || '').trim();

          if (!name && !birthDate && !phoneRaw) return;
          if (!name || !birthDate || !phoneRaw || !job || !interviewDate || !interviewTime || !location) {
            throw new Error(`${idx + 2}행에 필수 값이 비어 있습니다.`);
          }

          parsed.push({
            id: Math.max(...applicants.map((a) => a.id), 0) + parsed.length + 1,
            name,
            birthDate,
            phone: formatPhoneNumber(phoneRaw),
            job,
            interviewDate,
            interviewTime,
            location,
            notes
          });
        });

        if (!parsed.length) {
          throw new Error('데이터가 없습니다. 템플릿 형식을 확인하세요.');
        }

        setApplicants(parsed);
        e.target.value = '';
      } catch (err) {
        setImportError(err.message || '엑셀 파일을 불러오는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">면접 일정 조회 서비스</h1>
        </div>

        {showAdminPassword && route === 'admin' && !isAdminAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">관리자 인증</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAdminLogin)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  확인
                </button>
                <button
                  onClick={() => setShowAdminPassword(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">* 기본 비밀번호: admin1234</p>
            </div>
          </div>
        )}

        {route === 'search' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">면접 일정 조회</h2>

            {!searchResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                  <input
                    type="text"
                    value={searchForm.name}
                    onChange={(e) => setSearchForm({ ...searchForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                  <input
                    type="date"
                    value={searchForm.birthDate}
                    onChange={(e) => setSearchForm({ ...searchForm, birthDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                  <input
                    type="tel"
                    value={searchForm.phone}
                    onChange={(e) =>
                      setSearchForm({ ...searchForm, phone: formatPhoneNumber(e.target.value) })
                    }
                    onKeyPress={(e) => handleKeyPress(e, handleSearch)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <Search className="inline w-5 h-5 mr-2" />
                  조회하기
                </button>
              </div>
            ) : searchResult === 'not_found' ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">조회 결과가 없습니다</h3>
                <p className="text-gray-600 mb-6">
                  입력하신 정보와 일치하는 지원자를 찾을 수 없습니다.
                  <br />
                  정보를 다시 확인해 주세요.
                </p>
                <button
                  onClick={() => {
                    setSearchResult(null);
                    setSearchForm({ name: '', birthDate: '', phone: '' });
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  다시 조회하기
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-2">
                    면접 일정이 확인되었습니다
                  </h3>
                  <p className="text-green-700">{searchResult.name}님의 면접 정보입니다.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-700">면접 일시</p>
                      <p className="text-lg font-bold text-gray-900">
                        {searchResult.interviewDate} {searchResult.interviewTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-700">면접 장소</p>
                      <p className="text-lg font-bold text-gray-900">{searchResult.location}</p>
                    </div>
                  </div>

                  {searchResult.job && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-medium text-gray-700">직무</p>
                        <p className="text-lg font-bold text-gray-900">{searchResult.job}</p>
                      </div>
                    </div>
                  )}

                  {searchResult.notes && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="font-medium text-yellow-800 mb-2">추가 유의사항</p>
                      <p className="text-yellow-900">{searchResult.notes}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSearchResult(null);
                    setSearchForm({ name: '', birthDate: '', phone: '' });
                  }}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        )}

        {route === 'admin' && isAdminAuthenticated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">지원자 관리</h2>
                <p className="text-sm text-gray-500">주소창에서 #/admin으로 접근한 별도 페이지입니다.</p>
              </div>
              <a href="#/" className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                조회 페이지로 이동
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleTemplateDownload}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                템플릿 다운로드
              </button>
              <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded cursor-pointer hover:bg-blue-100">
                <Upload className="w-4 h-4" />
                엑셀 업로드
                <input type="file" accept=".xlsx,.xls" onChange={handleXlsxUpload} className="hidden" />
              </label>
              {importError && <span className="text-sm text-red-600">{importError}</span>}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-bold text-gray-800 mb-3">{editingId ? '지원자 수정' : '지원자 추가'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newApplicant.name}
                  onChange={(e) => setNewApplicant({ ...newApplicant, name: e.target.value })}
                  placeholder="이름"
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="date"
                  value={newApplicant.birthDate}
                  onChange={(e) => setNewApplicant({ ...newApplicant, birthDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="tel"
                  value={newApplicant.phone}
                  onChange={(e) =>
                    setNewApplicant({ ...newApplicant, phone: formatPhoneNumber(e.target.value) })
                  }
                  placeholder="010-1234-5678"
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={newApplicant.job}
                  onChange={(e) => setNewApplicant({ ...newApplicant, job: e.target.value })}
                  placeholder="직무"
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="date"
                  value={newApplicant.interviewDate}
                  onChange={(e) =>
                    setNewApplicant({ ...newApplicant, interviewDate: e.target.value })
                  }
                  placeholder="면접 날짜"
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="time"
                  value={newApplicant.interviewTime}
                  onChange={(e) =>
                    setNewApplicant({ ...newApplicant, interviewTime: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={newApplicant.location}
                  onChange={(e) => setNewApplicant({ ...newApplicant, location: e.target.value })}
                  placeholder="면접 장소"
                  className="px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <textarea
                value={newApplicant.notes}
                onChange={(e) => setNewApplicant({ ...newApplicant, notes: e.target.value })}
                placeholder="유의사항"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={editingId ? handleUpdateApplicant : handleAddApplicant}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                  {editingId ? (
                    '수정'
                  ) : (
                    <>
                      <Plus className="inline w-4 h-4 mr-1" />
                      추가
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      resetNewApplicant();
                    }}
                    className="px-4 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-800">전체 지원자 ({applicants.length}명)</h3>
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{applicant.name}</p>
                      <p className="text-sm text-gray-600">
                        {applicant.birthDate} | {applicant.phone}
                      </p>
                      {applicant.job && <p className="text-sm text-gray-600">직무: {applicant.job}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditApplicant(applicant)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApplicant(applicant.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-700">
                      <Clock className="inline w-4 h-4 mr-1" />
                      {applicant.interviewDate} {applicant.interviewTime}
                    </p>
                    <p className="text-gray-700">장소 {applicant.location}</p>
                    {applicant.notes && <p className="text-gray-600">비고 {applicant.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
