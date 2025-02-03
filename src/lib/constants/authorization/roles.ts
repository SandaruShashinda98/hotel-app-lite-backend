export enum PERMISSIONS {
  //desk related
  CREATE_DESK = 'CREATE_DESK', // Can create desks
  EDIT_DESK = 'EDIT_DESK', // Can edit desks
  DELETE_DESK = 'DELETE_DESK', // Can delete desks
  DESK_ASSIGNMENT_NEW_AGENT = 'DESK_ASSIGNMENT_NEW_AGENT', // Can assign agents to desks
  DESK_OUTSIDE = 'DESK_OUTSIDE', // Has access to all data not belonging to any desk
  SHOW_ALL_DESKS = 'SHOW_ALL_DESKS', // Has access to the data for all the desks, both on the Realtime page and in the reports
  SHOW_ALL_DESKS_REALTIME = 'SHOW_ALL_DESKS_REALTIME', // Can view all the desks on the Realtime page, but can run reports only for the desks he/she is assigned to
  SHOW_ALL_DESKS_REPORTS = 'SHOW_ALL_DESKS_REPORTS', // Can run reports for all the desks, but can see the Realtime page only for the desks he/she is assigned to
  SHOW_DESK = 'SHOW_DESK', // Can view the desk list
  SHOW_DESK_DASHBOARD = 'SHOW_DESK_DASHBOARD', // Can view all the desks on the Realtime page

  //user management related
  CREATE_USER = 'CREATE_USER', // Can create users
  DELETE_USER = 'DELETE_USER', // Can delete users
  EDIT_USER = 'EDIT_USER', // Can edit users
  SHOW_USER = 'SHOW_USER', // Can view users

  //roles related
  CREATE_ROLE = 'CREATE_ROLE', // Can create roles
  EDIT_ROLE = 'EDIT_ROLE', // Can edit roles
  DELETE_ROLE = 'DELETE_ROLE', // Can delete roles
  SHOW_ROLE = 'SHOW_ROLE', // Can view roles

  //device related
  CREATE_DEVICE = 'CREATE_DEVICE', // Can create devices
  CREATE_DEVICE_BULK = 'CREATE_DEVICE_BULK', // Can create multiple devices
  DELETE_DEVICE = 'DELETE_DEVICE', // Can delete devices
  EDIT_DEVICE = 'EDIT_DEVICE', // Can edit devices
  SHOW_DEVICE = 'SHOW_DEVICE', // Can view devices
  SHOW_DEVICE_PASSWORD = 'SHOW_DEVICE_PASSWORD', // Can view device passwords

  //web hooks related
  CREATE_WEBHOOK = 'CREATE_WEBHOOK', // Can create webhooks
  DELETE_WEBHOOK = 'DELETE_WEBHOOK', // Can delete webhooks
  EDIT_WEBHOOK = 'EDIT_WEBHOOK', // Can edit webhooks
  SHOW_WEBHOOK = 'SHOW_WEBHOOK', // Can view webhooks

  //api related
  ACCESS_API_KEY = 'ACCESS_API_KEY', // Can access the API key
  API_DOCS = 'API_DOCS', // Can access PBX Stats API documents

  //other
  ADMIN = 'ADMIN', // Can access all sections and features of PBX Stats
  CAN_HANGUP_CALL = 'CAN_HANGUP_CALL', // Can perform call hangup
  CREATE_AGENT = 'CREATE_AGENT', // Can create agents
  CREATE_AGENT_BULK = 'CREATE_AGENT_BULK', // Can create multiple agents
  CREATE_OUTBOUND_IDENTITY = 'CREATE_OUTBOUND_IDENTITY', // Can create outbound identities
  CREATE_PAUSE_TYPE = 'CREATE_PAUSE_TYPE', // Can create pause types
  CREATE_SCHEDULED_REPORT = 'CREATE_SCHEDULED_REPORT', // Can create scheduled reports
  CREATE_SHIFT = 'CREATE_SHIFT', // Can create shifts
  DELETE_OUTBOUND_IDENTITY = 'DELETE_OUTBOUND_IDENTITY', // Can delete outbound identities
  DELETE_QUEUED_REQUEST = 'DELETE_QUEUED_REQUEST', // Can delete queued requests
  DELETE_SCHEDULED_REPORT = 'DELETE_SCHEDULED_REPORT', // Can delete scheduled reports
  DELETE_SHIFT = 'DELETE_SHIFT', // Can delete shifts
  DISABLE_PAUSE_TYPE = 'DISABLE_PAUSE_TYPE', // Can disable the Pause Types function
  DO_AGENT_LOGOUT = 'DO_AGENT_LOGOUT', // Can log out an agent via the realtime page
  DO_AGENT_PAUSE = 'DO_AGENT_PAUSE', // Can pause an agent via the realtime page
  DO_AGENT_WHISPER = 'DO_AGENT_WHISPER', // Can whisper to agents via the realtime page
  DOWNLOAD_AGENT_STATS = 'DOWNLOAD_AGENT_STATS', // Can download the Agent Statistics report
  DOWNLOAD_CDRS = 'DOWNLOAD_CDRS', // Can download the CDR list
  DOWNLOAD_QUEUE_STATS = 'DOWNLOAD_QUEUE_STATS', // Can download the Queue Statistics report
  DOWNLOAD_RECORDING = 'DOWNLOAD_RECORDING', // Can download call recordings from CDRs
  EDIT_OUTBOUND_IDENTITY = 'EDIT_OUTBOUND_IDENTITY', // Can edit outbound identities
  EDIT_PAUSE_TYPE = 'EDIT_PAUSE_TYPE', // Can edit pause types
  EDIT_QUEUE_MANAGER = 'EDIT_QUEUE_MANAGER', // Can edit the Queue Manager
  EDIT_SCHEDULED_REPORT = 'EDIT_SCHEDULED_REPORT', // Can edit scheduled reports
  EDIT_SHIFT = 'EDIT_SHIFT', // Can edit shifts
  FAIL_QUEUED_REQUEST = 'FAIL_QUEUED_REQUEST', // Can mark a queued request as failed
  FILTER_TEMPLATE_REMOVE = 'FILTER_TEMPLATE_REMOVE', // Can remove report templates
  FILTER_TEMPLATE_SAVE = 'FILTER_TEMPLATE_SAVE', // Can save report templates
  FILTER_TEMPLATE_USE = 'FILTER_TEMPLATE_USE', // Can select report templates
  LISTEN_RECORDING = 'LISTEN_RECORDING', // Can listen to call recordings in the CDR list
  PRINT_AGENT_STATS = 'PRINT_AGENT_STATS', // Can print the Agent Statistics report
  PRINT_CDR = 'PRINT_CDR', // Can print CDRs
  PRINT_QUEUE_STATS = 'PRINT_QUEUE_STATS', // Can print the Queue Statistics report
  REQUEUED_QUEUED_REQUEST = 'REQUEUED_QUEUED_REQUEST', // Can send a queued request again
  SEARCH_INTERNATIONAL_PREFIX = 'SEARCH_INTERNATIONAL_PREFIX', // Can search for an international prefix in the CDR list
  SEARCH_TECH_PREFIX = 'SEARCH_TECH_PREFIX', // Can search for a tech prefix in the CDR list
  SHOW_ACTIVITY_LOG = 'SHOW_ACTIVITY_LOG', // Can view the activity log
  SHOW_AGENT = 'SHOW_AGENT', // Can view agents
  SHOW_AGENT_STATS = 'SHOW_AGENT_STATS', // Can view the Agent Statistics report
  SHOW_CDR = 'SHOW_CDR', // Can view the CDR List
  SHOW_CDR_EVENT = 'SHOW_CDR_EVENT', // Can view CDR events in the drop-down list
  SHOW_CDR_TRANSFER = 'SHOW_CDR_TRANSFER', // Can view all the transferred calls in the CDR list
  SHOW_COST = 'SHOW_COST', // Can view the call cost
  SHOW_CURRENT_QUEUES = 'SHOW_CURRENT_QUEUES', // Can view the Current Queues page
  SHOW_INDEX = 'SHOW_INDEX', // Can view the main dashboard
  SHOW_OUTBOUND_IDENTITY = 'SHOW_OUTBOUND_IDENTITY', // Can view outbound identities
  SHOW_PAUSE_TYPE = 'SHOW_PAUSE_TYPE', // Can view pause types
  SHOW_QUEUE = 'SHOW_QUEUE', // Can view queues
  SHOW_QUEUED_REQUEST = 'SHOW_QUEUED_REQUEST', // Can view queued requests
  SHOW_QUEUE_MANAGER = 'SHOW_QUEUE_MANAGER', // Can view the queue manager
  SHOW_QUEUE_STATS = 'SHOW_QUEUE_STATS', // Can view the Queue Statistics report
  SHOW_RELATED_CDR = 'SHOW_RELATED_CDR', // Can view related CDRs in the drop-down list
  SHOW_SCHEDULED_REPORT = 'SHOW_SCHEDULED_REPORT', // Can view scheduled reports
  SHOW_SHIFT = 'SHOW_SHIFT', // Can view shifts
  SHOW_TASKS = 'SHOW_TASKS', // Can view tasks
  TASK_DOWNLOAD = 'TASK_DOWNLOAD', // Can download exported reports from Tasks Users Module
}

export const PERMISSIONS_DESCRIPTION: Record<string, string> = {
  CREATE_DESK: 'Can create desks',
  EDIT_DESK: 'Can edit desks',
  DELETE_DESK: 'Can delete desks',
  DESK_ASSIGNMENT_NEW_AGENT: 'Can assign agents to desks',
  DESK_OUTSIDE: 'Has access to all data not belonging to any desk',
  SHOW_ALL_DESKS:
    'Has access to the data for all the desks, both on the Realtime page and in the reports',
  SHOW_ALL_DESKS_REALTIME:
    'Can view all the desks on the Realtime page, but can run reports only for the desks he/she is assigned to',
  SHOW_ALL_DESKS_REPORTS:
    'Can run reports for all the desks, but can see the Realtime page only for the desks he/she is assigned to',
  SHOW_DESK: 'Can view the desk list',
  SHOW_DESK_DASHBOARD: 'Can view all the desks on the Realtime page',
  CREATE_USER: 'Can create users',
  DELETE_USER: 'Can delete users',
  EDIT_USER: 'Can edit users',
  SHOW_USER: 'Can view users',
  CREATE_ROLE: 'Can create roles',
  EDIT_ROLE: 'Can edit roles',
  DELETE_ROLE: 'Can delete roles',
  SHOW_ROLE: 'Can view roles',
  CREATE_DEVICE: 'Can create devices',
  CREATE_DEVICE_BULK: 'Can create multiple devices',
  DELETE_DEVICE: 'Can delete devices',
  EDIT_DEVICE: 'Can edit devices',
  SHOW_DEVICE: 'Can view devices',
  SHOW_DEVICE_PASSWORD: 'Can view device passwords',
  CREATE_WEBHOOK: 'Can create webhooks',
  DELETE_WEBHOOK: 'Can delete webhooks',
  EDIT_WEBHOOK: 'Can edit webhooks',
  SHOW_WEBHOOK: 'Can view webhooks',
  ACCESS_API_KEY: 'Can access the API key',
  API_DOCS: 'Can access PBX Stats API documents',
  ADMIN: 'Can access all sections and features of PBX Stats',
  CAN_HANGUP_CALL: 'Can perform call hangup',
  CREATE_AGENT: 'Can create agents',
  CREATE_AGENT_BULK: 'Can create multiple agents',
  CREATE_OUTBOUND_IDENTITY: 'Can create outbound identities',
  CREATE_PAUSE_TYPE: 'Can create pause types',
  CREATE_SCHEDULED_REPORT: 'Can create scheduled reports',
  CREATE_SHIFT: 'Can create shifts',
  DELETE_OUTBOUND_IDENTITY: 'Can delete outbound identities',
  DELETE_QUEUED_REQUEST: 'Can delete queued requests',
  DELETE_SCHEDULED_REPORT: 'Can delete scheduled reports',
  DELETE_SHIFT: 'Can delete shifts',
  DISABLE_PAUSE_TYPE: 'Can disable the Pause Types function',
  DO_AGENT_LOGOUT: 'Can log out an agent via the realtime page',
  DO_AGENT_PAUSE: 'Can pause an agent via the realtime page',
  DO_AGENT_WHISPER: 'Can whisper to agents via the realtime page',
  DOWNLOAD_AGENT_STATS: 'Can download the Agent Statistics report',
  DOWNLOAD_CDRS: 'Can download the CDR list',
  DOWNLOAD_QUEUE_STATS: 'Can download the Queue Statistics report',
  DOWNLOAD_RECORDING: 'Can download call recordings from CDRs',
  EDIT_OUTBOUND_IDENTITY: 'Can edit outbound identities',
  EDIT_PAUSE_TYPE: 'Can edit pause types',
  EDIT_QUEUE_MANAGER: 'Can edit the Queue Manager',
  EDIT_SCHEDULED_REPORT: 'Can edit scheduled reports',
  EDIT_SHIFT: 'Can edit shifts',
  FAIL_QUEUED_REQUEST: 'Can mark a queued request as failed',
  FILTER_TEMPLATE_REMOVE: 'Can remove report templates',
  FILTER_TEMPLATE_SAVE: 'Can save report templates',
  FILTER_TEMPLATE_USE: 'Can select report templates',
  LISTEN_RECORDING: 'Can listen to call recordings in the CDR list',
  PRINT_AGENT_STATS: 'Can print the Agent Statistics report',
  PRINT_CDR: 'Can print CDRs',
  PRINT_QUEUE_STATS: 'Can print the Queue Statistics report',
  REQUEUED_QUEUED_REQUEST: 'Can send a queued request again',
  SEARCH_INTERNATIONAL_PREFIX:
    'Can search for an international prefix in the CDR list',
  SEARCH_TECH_PREFIX: 'Can search for a tech prefix in the CDR list',
  SHOW_ACTIVITY_LOG: 'Can view the activity log',
  SHOW_AGENT: 'Can view agents',
  SHOW_AGENT_STATS: 'Can view the Agent Statistics report',
  SHOW_CDR: 'Can view the CDR List',
  SHOW_CDR_EVENT: 'Can view CDR events in the drop-down list',
  SHOW_CDR_TRANSFER: 'Can view all the transferred calls in the CDR list',
  SHOW_COST: 'Can view the call cost',
  SHOW_CURRENT_QUEUES: 'Can view the Current Queues page',
  SHOW_INDEX: 'Can view the main dashboard',
  SHOW_OUTBOUND_IDENTITY: 'Can view outbound identities',
  SHOW_PAUSE_TYPE: 'Can view pause types',
  SHOW_QUEUE: 'Can view queues',
  SHOW_QUEUED_REQUEST: 'Can view queued requests',
  SHOW_QUEUE_MANAGER: 'Can view the queue manager',
  SHOW_QUEUE_STATS: 'Can view the Queue Statistics report',
  SHOW_RELATED_CDR: 'Can view related CDRs in the drop-down list',
  SHOW_SCHEDULED_REPORT: 'Can view scheduled reports',
  SHOW_SHIFT: 'Can view shifts',
  SHOW_TASKS: 'Can view tasks',
  TASK_DOWNLOAD: 'Can download exported reports from Tasks Users Module',
};
