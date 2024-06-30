function getUserByEmail(email) {
    if (email === 'test1') {
        return JSON.stringify({
            row: 2,
            data: [
                'test1',
                'Test Name',
                'English',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ],
        });
    }
    if (email === 'test3') {
        throw new Error('test error');
    }
    return JSON.stringify({ error: 'NOT_FOUND' });
}

const google = {};
google.script = {};
google.script.run = {};
google.script.run.withFailureHandler = (_) => ({
    withSuccessHandler: (f) => ({
        getUserByEmail: (email) => f(getUserByEmail(email)),
    }),
});
