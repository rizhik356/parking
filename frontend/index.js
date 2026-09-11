document.addEventListener('DOMContentLoaded', () => {
    let total = 0;
    let occupied = 0;

    const settingsBtn = document.querySelector('.settings_btn');
    const settingContainer = document.querySelector('.settings');

    const copyGuestUrlBtn = document.querySelector('.guest_link_btn');

    const freeNumber = document.querySelector('.free_number');
    const totalNumber = document.querySelector('.total_number');
    const busyNumber = document.querySelector('.busy_number');
    const barmeterFill = document.querySelector('.barmeter_fill');

    const totalInput = document.querySelector('#totalInput');

    const minusBtn = document.querySelector('.minus');
    const plusBtn = document.querySelector('.plus');

    const status = document.querySelector('.status');
    const statusDot = document.querySelector('.status_dot');

    const resetBtn = document.querySelector('.reset_btn');
    const saveBtn = document.querySelector('.save_btn');

    const confirmOverlay = document.querySelector('.confirm_overlay');
    const confirmCancelBtn = document.querySelector('.confirm_cancel');
    const confirmOkBtn = document.querySelector('.confirm_ok');


    function openConfirm() {
        confirmOverlay.classList.add('open');
    }

    function closeConfirm() {
        confirmOverlay.classList.remove('open');
    }


    function render() {
        const free = Math.max(total - occupied, 0);

        freeNumber.textContent = String(free);
        totalInput.value = String(total);

        totalNumber.textContent = String(total);
        busyNumber.textContent = String(occupied);

        const occupiedPercent =
            total > 0
                ? (occupied / total) * 100
                : 0;

        barmeterFill.style.width = `${occupiedPercent}%`;

        minusBtn.disabled = occupied === 0;
        plusBtn.disabled = occupied >= total;
    }


    function updateState(data) {
        total = data.totalPlaces;
        occupied = data.occupiedPlaces;

        render();
    }


    async function checkResponse(response) {
        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message || 'Произошла ошибка'
            );
        }

        return data;
    }


    function setStatus(message, type = 'loading') {
        status.textContent = message;

        status.classList.remove(
            'loading',
            'success',
            'error'
        );

        statusDot.classList.remove(
            'loading',
            'success',
            'error'
        );

        status.classList.add(type);
        statusDot.classList.add(type);
    }


    async function getParking() {
        setStatus('Ожидание данных', 'loading');

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking`
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus('Данные обновлены', 'success');
        } catch (error) {
            setStatus(
                error.message || 'Ошибка загрузки',
                'error'
            );

            // Повторяем GET через 5 секунд
            setTimeout(getParking, 5000);
        }
    }


    async function syncParking() {
        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking`
            );

            const data = await checkResponse(response);

            updateState(data);
        } catch (error) {
            // Фоновая синхронизация не меняет статус
        }
    }


    async function entry() {
        plusBtn.disabled = true;
        minusBtn.disabled = true;

        setStatus(
            'Регистрация въезда',
            'loading'
        );

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking/entry`,
                {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': CONFIG.API_SECRET,
                    },
                }
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Въезд зарегистрирован',
                'success'
            );
        } catch (error) {

            setStatus(
                error.message ||
                'Не удалось зарегистрировать въезд',
                'error'
            );

            // Возвращаем кнопкам актуальное состояние
            render();
        }
    }


    async function exit() {
        plusBtn.disabled = true;
        minusBtn.disabled = true;

        setStatus(
            'Регистрация выезда',
            'loading'
        );

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking/exit`,
                {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': CONFIG.API_SECRET,
                    },
                }
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Выезд зарегистрирован',
                'success'
            );
        } catch (error) {

            setStatus(
                error.message ||
                'Не удалось зарегистрировать выезд',
                'error'
            );

            render();
        }
    }


    async function reset() {
        resetBtn.disabled = true;

        setStatus(
            'Сброс парковки',
            'loading'
        );

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking/reset`,
                {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': CONFIG.API_SECRET,
                    },
                }
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Парковка сброшена',
                'success'
            );
        } catch (error) {

            setStatus(
                error.message ||
                'Не удалось сбросить парковку',
                'error'
            );
        } finally {
            resetBtn.disabled = false;
        }
    }


    async function updateTotalPlaces(value) {
        saveBtn.disabled = true;

        setStatus(
            'Изменение количества мест',
            'loading'
        );

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': CONFIG.API_SECRET,
                    },
                    body: JSON.stringify({
                        totalPlaces: value,
                    }),
                }
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Количество мест изменено',
                'success'
            );
        } catch (error) {

            setStatus(
                error.message ||
                'Не удалось изменить количество мест',
                'error'
            );
            render();
        } finally {
            saveBtn.disabled = false;
        }
    }


    settingsBtn.addEventListener('click', () => {
        settingContainer.classList.toggle('open');
    });


    plusBtn.addEventListener('click', async () => {
        await entry();
    });


    minusBtn.addEventListener('click', async () => {
        await exit();
    });


    resetBtn.addEventListener('click', () => {
        openConfirm();
    });

    confirmCancelBtn.addEventListener('click', () => {
        closeConfirm();
    });

    confirmOkBtn.addEventListener('click', async () => {
        closeConfirm();

        await reset();
    });

    confirmOverlay.addEventListener('click', (event) => {
        if (event.target === confirmOverlay) {
            closeConfirm();
        }
    });

    saveBtn.addEventListener('click', async () => {
        const value = Number(totalInput.value);

        if (!Number.isInteger(value) || value < 1) {
            setStatus(
                'Введите корректное количество мест',
                'error'
            );

            return;
        }

        if (value < occupied) {
            setStatus(
                'Количество мест не может быть меньше занятых',
                'error'
            );

            return;
        }

        await updateTotalPlaces(value);
    });

    copyGuestUrlBtn.addEventListener('click', async () => {
        const url = new URL(window.location.href);

        url.pathname = `${url.pathname.replace(/\/$/, '')}/guest`;

        await navigator.clipboard.writeText(url.toString());

        setStatus('Ссылка скопирована', 'success');
    });

    getParking();

    setInterval(syncParking, 10000);
});