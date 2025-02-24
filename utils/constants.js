const MODULES = {
    USERS: 12,
    CASES: 10,
    LOGS: 15,
    COUNTRIES: 11,
    PERMISSIONS: 13,
    REQUESTS: 14,
    RECYCLE_BIN: 16,
    MY_ACCOUNT: 9,
    DASHBOARD: 8
}

const STATUS_USER = {
    ACTIVE: 6,
    INACTIVE: 7,
    PENDING_ACTIVATION: 10,
    DELETED: 9
}

const TABLE_MAPPING = {
    [MODULES.USERS]: 'users',
    [MODULES.COUNTRIES]: 'dc',
    [MODULES.CASES]: 'cases'
};

module.exports = {
    MODULES,
    STATUS_USER,
    TABLE_MAPPING
}
