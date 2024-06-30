const google = {
    script: {
        run: {
            withSuccessHandler: (f) => {
                getUserByEmail: (email) => {
                    if (email === 'test1') return "{data:['']}";
                };
            },
        },
    },
};
