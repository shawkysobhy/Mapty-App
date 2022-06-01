'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const delete_btn = document.querySelector('.delete-icon')


class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workOuts = [];
  constructor() {
  
    this._getPosition();
    this._getLocalStorge();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevation);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    delete_btn.addEventListener('click',()=>{
      this._resetWorkouts();
    })
  }
  _getPosition () {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
      alert('user not allow to get postion');
    });
  }

  _loadMap (position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this._renderWorkouts();
  }


  _showForm (MapEv) {
    this.#mapEvent = MapEv;
    form.classList.remove('hidden');
  }

  _hideForm () {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
      '';
    form.classList.add('hidden');
  }

  _toggleElevation () {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout (e) {

    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    ///////////////
    const allPositive = (...inputs) => inputs.every(input => input > 0);
    //////////////////
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    if (type == 'running') {
      const cadence = +inputCadence.value;
      //check data valid or not
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('should insert positive number');
      }

      workout = new Running([lat, lng], distance, duration, cadence);

    }
    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      if (!allPositive(distance, duration) || !validInputs(distance, duration, elevation)) {
        return alert('should insert positive number');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);

    }
    this._renderWorkoutMarker(workout)

    this.#workOuts.push(workout);
    this._renderWorkout(workout)
    this._hideForm();

    //set local storage 
    this._setLocalStorege();
  }


  _renderWorkoutMarker (workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`

      )
      .openPopup();
  }

  _renderWorkout (workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♀️' : '🚴‍♀️'
      }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup (e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workOuts.find(
      work => work.id === Number(workoutEl.dataset.id)
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

  }
  _setLocalStorege () {
    localStorage.setItem('workouts', JSON.stringify(this.#workOuts));
  }
  _getLocalStorge () {
    let data = localStorage.getItem('workouts');
    if (!data) return;
    data = JSON.parse(data);
    this.#workOuts = data;

  }

  _renderWorkouts () {
    this.#workOuts.forEach(workout => {
      this._renderWorkout(workout);
      this._renderWorkoutMarker(workout)
    })
  }

  _resetWorkouts () {
    localStorage.removeItem('workouts');
    location.reload();
  }
}


class Workout {
  date = new Date();
  id = this._generateID();

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

   _generateID(){
 
    let date = new Date();
    let components = [
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ];
    let id = Math.floor(Math.random() + Number(components.join('')));
    return id;
  }

  _setDescription () {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]
      } ${this.date.getDate()}`;
  }


}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calculatePace();
    this._setDescription()
  }
  calculatePace () {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calculateSpeed();
    this._setDescription()

  }
  calculateSpeed () {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

let app = new App();
