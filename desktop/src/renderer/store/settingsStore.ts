import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ko' | 'en' | 'ja';

export const languageLabels: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

interface SettingsState {
  language: Language;
  darkMode: boolean;

  setLanguage: (language: Language) => void;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'ko',
      darkMode: false,

      setLanguage: (language) => set({ language }),
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleDarkMode: () => set({ darkMode: !get().darkMode }),
    }),
    {
      name: 'remote-puppet-settings',
    }
  )
);

// Simple i18n translations
export const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Common
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '편집',
    'common.add': '추가',
    'common.search': '검색',
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    'common.confirm': '확인',
    'common.back': '뒤로',
    'common.close': '닫기',

    // Navigation
    'nav.devices': '기기 관리',
    'nav.folders': '폴더 관리',
    'nav.settings': '설정',
    'nav.logout': '로그아웃',

    // Devices
    'devices.title': '기기 관리',
    'devices.addDevice': '기기 추가',
    'devices.addFolder': '폴더 추가',
    'devices.allDevices': '전체 기기',
    'devices.uncategorized': '미분류',
    'devices.online': '온라인',
    'devices.offline': '오프라인',
    'devices.busy': '사용 중',
    'devices.connect': '연결',
    'devices.noDevices': '기기가 없습니다',
    'devices.searchPlaceholder': '기기 검색...',

    // Folders
    'folders.title': '폴더 관리',
    'folders.addFolder': '새 폴더',
    'folders.editFolder': '폴더 편집',
    'folders.deleteFolder': '폴더 삭제',
    'folders.folderName': '폴더 이름',
    'folders.deviceCount': '기기 수',
    'folders.noFolders': '폴더가 없습니다',
    'folders.deleteConfirm': '이 폴더를 삭제하시겠습니까? 폴더 내 기기는 미분류로 이동됩니다.',

    // Control
    'control.title': '원격 제어',
    'control.reconnect': '재연결',
    'control.disconnect': '연결 해제',
    'control.back': '뒤로',
    'control.home': '홈',
    'control.recent': '최근',
    'control.power': '전원',
    'control.reboot': '재부팅',
    'control.lockScreen': '잠금',
    'control.screenshot': '스크린샷',
    'control.disconnected': '연결 끊김',
    'control.connecting': '연결 중...',
    'control.streaming': '스트리밍 중',
    'control.deviceControls': '기기 제어',
    'control.systemMetrics': '시스템 정보',
    'control.applicationLogs': '애플리케이션 로그',
    'control.tabs.screen': '원격 화면',
    'control.tabs.files': '파일 탐색기',
    'control.tabs.logs': 'Logcat',
    'control.tabs.shell': 'Shell',

    // Settings
    'settings.title': '설정',
    'settings.description': '애플리케이션 설정을 관리합니다',
    'settings.language': '언어',
    'settings.languageDescription': '애플리케이션 표시 언어를 선택합니다',
    'settings.darkMode': '다크 모드',
    'settings.darkModeDescription': '어두운 테마를 사용합니다',
    'settings.appearance': '외관',

    // Devices Page
    'devices.description': '기기를 관리하고 원격으로 제어합니다',
    'devices.dragHint': '기기를 드래그하여 폴더 이동',
    'devices.deviceName': '기기명',
    'devices.model': '모델',
    'devices.os': 'OS',
    'devices.status': '상태',
    'devices.folder': '폴더',
    'devices.actions': '작업',
    'devices.addComplete': '기기 추가 완료',
    'devices.enterCode': 'Android Agent 앱에서 이 코드를 입력하세요',
    'devices.codeConnected': '연결되면 기기 목록에 나타납니다',
    'devices.done': '완료',
    'devices.adding': '추가 중...',
    'devices.renameDevice': '기기 이름 변경',
    'devices.deleteDevice': '기기 삭제',
    'devices.deleteConfirm': '정말로 이 기기를 삭제하시겠습니까?',
    'devices.cannotUndo': '이 작업은 되돌릴 수 없습니다',
    'devices.deleting': '삭제 중...',
    'devices.saving': '저장 중...',
    'devices.noDevicesHint': '기기를 추가하여 원격 제어를 시작하세요',

    // Folders Page
    'folders.description': '기기 그룹을 관리합니다',
    'folders.noFoldersHint': '새 폴더를 만들어 기기를 정리하세요',
    'folders.totalDevices': '총 기기 수',
    'folders.online': '온라인',
    'folders.offline': '오프라인',
    'folders.deviceList': '기기 목록',
    'folders.unit': '대',

    // Auth
    'auth.login': '로그인',
    'auth.signup': '회원가입',
    'auth.email': '이메일',
    'auth.password': '비밀번호',
    'auth.confirmPassword': '비밀번호 확인',
    'auth.firstName': '이름',
    'auth.lastName': '성',
    'auth.serverUrl': '서버 URL',
    'auth.noAccount': '계정이 없으신가요?',
    'auth.hasAccount': '이미 계정이 있으신가요?',
    'auth.subtitle': '모바일 기기 관리 시스템',
    'auth.signupSubtitle': '새 계정을 만들어보세요',
    'auth.or': '또는',
    'auth.passwordMismatch': '비밀번호가 일치하지 않습니다',
    'auth.authFailed': '인증에 실패했습니다',
  },
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.close': 'Close',

    // Navigation
    'nav.devices': 'Devices',
    'nav.folders': 'Folders',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Devices
    'devices.title': 'Device Management',
    'devices.addDevice': 'Add Device',
    'devices.addFolder': 'Add Folder',
    'devices.allDevices': 'All Devices',
    'devices.uncategorized': 'Uncategorized',
    'devices.online': 'Online',
    'devices.offline': 'Offline',
    'devices.busy': 'Busy',
    'devices.connect': 'Connect',
    'devices.noDevices': 'No devices found',
    'devices.searchPlaceholder': 'Search devices...',

    // Folders
    'folders.title': 'Folder Management',
    'folders.addFolder': 'New Folder',
    'folders.editFolder': 'Edit Folder',
    'folders.deleteFolder': 'Delete Folder',
    'folders.folderName': 'Folder Name',
    'folders.deviceCount': 'Device Count',
    'folders.noFolders': 'No folders found',
    'folders.deleteConfirm': 'Are you sure you want to delete this folder? Devices in this folder will be moved to Uncategorized.',

    // Control
    'control.title': 'Remote Control',
    'control.reconnect': 'Reconnect',
    'control.disconnect': 'Disconnect',
    'control.back': 'Back',
    'control.home': 'Home',
    'control.recent': 'Recent',
    'control.power': 'Power',
    'control.reboot': 'Reboot',
    'control.lockScreen': 'Lock',
    'control.screenshot': 'Screenshot',
    'control.disconnected': 'Disconnected',
    'control.connecting': 'Connecting...',
    'control.streaming': 'Streaming',
    'control.deviceControls': 'Device Controls',
    'control.systemMetrics': 'System Metrics',
    'control.applicationLogs': 'Application Logs',
    'control.tabs.screen': 'Screen',
    'control.tabs.files': 'Files',
    'control.tabs.logs': 'Logcat',
    'control.tabs.shell': 'Shell',

    // Settings
    'settings.title': 'Settings',
    'settings.description': 'Manage application settings',
    'settings.language': 'Language',
    'settings.languageDescription': 'Select the display language',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDescription': 'Use dark theme',
    'settings.appearance': 'Appearance',

    // Devices Page
    'devices.description': 'Manage and remotely control devices',
    'devices.dragHint': 'Drag devices to move to folder',
    'devices.deviceName': 'Device Name',
    'devices.model': 'Model',
    'devices.os': 'OS',
    'devices.status': 'Status',
    'devices.folder': 'Folder',
    'devices.actions': 'Actions',
    'devices.addComplete': 'Device Added',
    'devices.enterCode': 'Enter this code in the Android Agent app',
    'devices.codeConnected': 'Device will appear in the list once connected',
    'devices.done': 'Done',
    'devices.adding': 'Adding...',
    'devices.renameDevice': 'Rename Device',
    'devices.deleteDevice': 'Delete Device',
    'devices.deleteConfirm': 'Are you sure you want to delete this device?',
    'devices.cannotUndo': 'This action cannot be undone',
    'devices.deleting': 'Deleting...',
    'devices.saving': 'Saving...',
    'devices.noDevicesHint': 'Add a device to start remote control',

    // Folders Page
    'folders.description': 'Manage device groups',
    'folders.noFoldersHint': 'Create folders to organize devices',
    'folders.totalDevices': 'Total Devices',
    'folders.online': 'Online',
    'folders.offline': 'Offline',
    'folders.deviceList': 'Device List',
    'folders.unit': '',

    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.serverUrl': 'Server URL',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.subtitle': 'Mobile Device Management System',
    'auth.signupSubtitle': 'Create a new account',
    'auth.or': 'or',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.authFailed': 'Authentication failed',
  },
  ja: {
    // Common
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.add': '追加',
    'common.search': '検索',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.confirm': '確認',
    'common.back': '戻る',
    'common.close': '閉じる',

    // Navigation
    'nav.devices': 'デバイス',
    'nav.folders': 'フォルダ',
    'nav.settings': '設定',
    'nav.logout': 'ログアウト',

    // Devices
    'devices.title': 'デバイス管理',
    'devices.addDevice': 'デバイス追加',
    'devices.addFolder': 'フォルダ追加',
    'devices.allDevices': 'すべてのデバイス',
    'devices.uncategorized': '未分類',
    'devices.online': 'オンライン',
    'devices.offline': 'オフライン',
    'devices.busy': '使用中',
    'devices.connect': '接続',
    'devices.noDevices': 'デバイスがありません',
    'devices.searchPlaceholder': 'デバイスを検索...',

    // Folders
    'folders.title': 'フォルダ管理',
    'folders.addFolder': '新しいフォルダ',
    'folders.editFolder': 'フォルダ編集',
    'folders.deleteFolder': 'フォルダ削除',
    'folders.folderName': 'フォルダ名',
    'folders.deviceCount': 'デバイス数',
    'folders.noFolders': 'フォルダがありません',
    'folders.deleteConfirm': 'このフォルダを削除しますか？フォルダ内のデバイスは未分類に移動されます。',

    // Control
    'control.title': 'リモートコントロール',
    'control.reconnect': '再接続',
    'control.disconnect': '切断',
    'control.back': '戻る',
    'control.home': 'ホーム',
    'control.recent': '最近',
    'control.power': '電源',
    'control.reboot': '再起動',
    'control.lockScreen': 'ロック',
    'control.screenshot': 'スクリーンショット',
    'control.disconnected': '切断されました',
    'control.connecting': '接続中...',
    'control.streaming': 'ストリーミング中',
    'control.deviceControls': 'デバイス操作',
    'control.systemMetrics': 'システム情報',
    'control.applicationLogs': 'アプリケーションログ',
    'control.tabs.screen': '画面',
    'control.tabs.files': 'ファイル',
    'control.tabs.logs': 'Logcat',
    'control.tabs.shell': 'Shell',

    // Settings
    'settings.title': '設定',
    'settings.description': 'アプリケーション設定を管理します',
    'settings.language': '言語',
    'settings.languageDescription': '表示言語を選択します',
    'settings.darkMode': 'ダークモード',
    'settings.darkModeDescription': 'ダークテーマを使用します',
    'settings.appearance': '外観',

    // Devices Page
    'devices.description': 'デバイスを管理し、リモートで制御します',
    'devices.dragHint': 'デバイスをドラッグしてフォルダに移動',
    'devices.deviceName': 'デバイス名',
    'devices.model': 'モデル',
    'devices.os': 'OS',
    'devices.status': 'ステータス',
    'devices.folder': 'フォルダ',
    'devices.actions': '操作',
    'devices.addComplete': 'デバイス追加完了',
    'devices.enterCode': 'Android Agentアプリでこのコードを入力してください',
    'devices.codeConnected': '接続するとデバイスリストに表示されます',
    'devices.done': '完了',
    'devices.adding': '追加中...',
    'devices.renameDevice': 'デバイス名変更',
    'devices.deleteDevice': 'デバイス削除',
    'devices.deleteConfirm': 'このデバイスを削除してもよろしいですか？',
    'devices.cannotUndo': 'この操作は元に戻せません',
    'devices.deleting': '削除中...',
    'devices.saving': '保存中...',
    'devices.noDevicesHint': 'デバイスを追加してリモートコントロールを開始',

    // Folders Page
    'folders.description': 'デバイスグループを管理します',
    'folders.noFoldersHint': 'フォルダを作成してデバイスを整理',
    'folders.totalDevices': 'デバイス総数',
    'folders.online': 'オンライン',
    'folders.offline': 'オフライン',
    'folders.deviceList': 'デバイスリスト',
    'folders.unit': '台',

    // Auth
    'auth.login': 'ログイン',
    'auth.signup': '新規登録',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード確認',
    'auth.firstName': '名前',
    'auth.lastName': '名字',
    'auth.serverUrl': 'サーバーURL',
    'auth.noAccount': 'アカウントをお持ちでないですか？',
    'auth.hasAccount': 'すでにアカウントをお持ちですか？',
    'auth.subtitle': 'モバイルデバイス管理システム',
    'auth.signupSubtitle': '新しいアカウントを作成',
    'auth.or': 'または',
    'auth.passwordMismatch': 'パスワードが一致しません',
    'auth.authFailed': '認証に失敗しました',
  },
};

// Hook for using translations
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return { t, language };
}
