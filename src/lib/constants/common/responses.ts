export const RESPONSE_MESSAGES = {
  //not found errors
  DATA_NOT_FOUND: 'No data found. Please review and try again.',

  //unprocessable errors
  DB_FAILURE: "Sorry, we couldn't process the data. Please try again later.",
  INVALID_PAYLOAD: 'ERR_INVALID_PAYLOAD',
  INVALID_CREDENTIALS:
    'Username or Password is incorrect. Please review and try again.',

  //forbidden errors
  FORBIDDEN_RESOURCE:
    "Access denied. You don't have permission to view this resource.",

  //-----users & auth section------
  INVALID_PASSWORD:
    'Password is not adhere to the password policy. Please review and try again',
  USERNAME_TAKEN: 'This username has taken. Please review and try again',
  EMAIL_TAKEN: 'This email has taken. Please review and try again',
  //-----clock-out section------
  DUPLICATE_CLOCK_OUT: 'Reason already exists. Please re-name and try again.',
  //-----roles section------
  DUPLICATE_ROLE:
    'Role name already exists. Please re-name the role and try again.',
  ROLE_CREATE_ERR:
    'Your file did not meet the required criteria for upload. Please review and try again.',

  //-----desks section------
  DUPLICATE_DESK: 'Desk name already exists. Please re-name and try again.',

  //-----skill group section-----
  DUPLICATE_SKILL_GROUP:
    'Skill Group name already exists. Please re-name and try again.',

  //----- group section-----
  DUPLICATE_GROUP: 'Group name already exists. Please re-name and try again.',

  //-----object list section-----
  DUPLICATE_OBJECT_LIST:
    'Object list name already exists. Please re-name and try again.',
  //------ leads section ------
  DUPLICATE_LEAD_FILTER:
    'Lead Filter name already exists. Please re-name and try again',
  CSV_GENERATE_ERROR:
    "Couldn't generate the CsvFormatterStream. Please try again",
  //-----settings section-----
  DUPLICATE_IP: 'IP address already exists. Please try again.',
};
