document.addEventListener('DOMContentLoaded', () => {
    let total = 0;
    let occupied = 0;

    const freeNumber = document.querySelector('.guest_free');
    const totalNumber = document.querySelector('.guest_total_number');

    const meterFill = document.querySelector('.guest_meter_fill');

    const status = document.querySelector('.guest_status');
    const statusDot = document.querySelector('.guest_status_dot');


    function render() {
        const free = Math.max(
            total - occupied,
            0
        );

        freeNumber.textContent = String(free);
        totalNumber.textContent = String(total);

        const occupiedPercent =
            total > 0
                ? (occupied / total) * 100
                : 0;

        meterFill.style.width =
            `${occupiedPercent}%`;
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

        statusDot.classList.remove(
            'success',
            'error'
        );

        statusDot.classList.add(type);
    }


    async function getParking() {
        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking`
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Данные обновлены',
                'success'
            );
        } catch (error) {
            setStatus(
                'Нет связи с сервером',
                'error'
            );

            setTimeout(
                getParking,
                5000
            );
        }
    }


    async function syncParking() {
        try {
            const response = await fetch(
                `${CONFIG.API_URL}/parking`
            );

            const data = await checkResponse(response);

            updateState(data);

            setStatus(
                'Данные обновлены',
                'success'
            );
        } catch {
            setStatus(
                'Нет связи с сервером',
                'error'
            );
        }
    }


    getParking();

    setInterval(
        syncParking,
        5000
    );
});