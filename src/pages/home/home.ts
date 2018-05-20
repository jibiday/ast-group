import {Component, NgZone, OnInit} from '@angular/core';
import {NavController} from 'ionic-angular';
import {mkad_coords} from "../../Model/MkadCoords";
import {Tonnage} from "../../Model/Tonnage";

declare let ymaps: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

  map;
  searchControl;
  selectedPoint;
  mkadPrecisePoint;
  arPlacemarksRez;
  distance: number;
  lt = 55.752797;
  lg = 37.622324;
  isButtondisabled: boolean;
  tonnages = [
    new Tonnage(1.5, 3500, 20),
    new Tonnage(5, 4000, 23),
    new Tonnage(10, 7000, 28),
    new Tonnage(20, 10000, 35)
  ];
  selectedTonnage: Tonnage;
  totalCost: number;
  enteredTonnage: number;

  constructor(public navCtrl: NavController,
              private ngZone: NgZone) {
  }

  ngOnInit(): void {
    ymaps.ready().then(() => {
      this.map = new ymaps.Map('map', {
        center: [this.lt, this.lg],
        zoom: 7,
        controls: ['searchControl', 'zoomControl', 'geolocationControl', 'fullscreenControl']
      });

      this.initMkad();

      this.map.events.add('click', event => {
        this.searchControl.clear();
        this.map.geoObjects.removeAll();
        this.selectedPoint = new ymaps.Placemark(event.get('coords'));
        this.map.geoObjects.add(this.selectedPoint);
      });
      this.searchControl = this.map.controls.get('searchControl');
      this.searchControl.options.set({noPlacemark: false});
      this.searchControl.events.add('load', event => {
        this.map.geoObjects.removeAll();
        this.selectedPoint = null;
      })
    });
  }

  initMkad() {
    let arPlacemarks = [];
    for (let i = 0; i < mkad_coords[0].length; i++)
      arPlacemarks[i] = new ymaps.Placemark(mkad_coords[0][i]);
    //к сожалению для корректного поиска ближайшей точки их все надо добавить
    //но мы их не будем отображать конечно же
    this.arPlacemarksRez = ymaps.geoQuery(arPlacemarks).addToMap(this.map).setOptions('visible', false);
    //вместо этого нарисуем полигон мкада. для красоты. он для расчётов нам не нужен
    // let mkad_polygon = new ymaps.Polygon(this.mkad_coords);
    // ymaps.geoQuery(mkad_polygon).addToMap(this.map);
    ymaps.geoQuery(arPlacemarks).applyBoundsToMap(this.map, {checkZoomRange: true});
  }

  getDistance() {
    if (this.selectedPoint) {
      this.getRoute(this.selectedPoint);
    } else {
      this.searchControl.getResult(0).then(res => {
          this.map.geoObjects.removeAll();
          this.getRoute(res);
        }
      );
    }
  }

  getRoute(res) {
    let coords = res.geometry.getCoordinates();
    if (coords) {
      this.selectedPoint = new ymaps.Placemark(coords, {}, {preset: 'islands#blueStretchyIcon', draggable: false});
    }
    // obj_collection = ymaps.geoQuery(needed_point).addToMap(map);

    //находим ближайшую точку мкада
    let closestObject = this.arPlacemarksRez.getClosestTo(coords);

    ymaps.route([
      coords,
      closestObject.geometry.getCoordinates()
    ]).then(route => {
        this.ngZone.run(() => {
          loop1: for (let i = 0; i < route.getPaths().getLength(); i++) {
            let way = route.getPaths().get(i);
            let segments = way.getSegments();
            for (let j = 0; j < segments.length; j++) {
              if (segments[j].getStreet() == 'МКАД') {
                this.mkadPrecisePoint = new ymaps.Placemark(segments[j].getCoordinates()[0]);
                this.map.geoObjects.add(this.mkadPrecisePoint);
                break loop1;
              }
            }
          }

          ymaps.route([
            coords,
            this.mkadPrecisePoint.geometry.getCoordinates()
          ]).then(route2 => {
            this.map.geoObjects.add(route2);
            this.distance = Math.round(route2.getLength() / 1000);
            console.log(this.distance);
            ymaps.geoQuery(route2.getPaths().get(0)).applyBoundsToMap(this.map, {checkZoomRange: true});
            this.selectedPoint.properties.set({iconContent: this.distance + ' км'});
            this.map.geoObjects.add(this.selectedPoint);
            this.calc();
          })
        });
      }
    );
  }

  calc() {
    if (this.selectedTonnage && this.distance) {
      this.totalCost = this.selectedTonnage.minimalPrice + (2 * this.selectedTonnage.pricePerKm * this.distance);
    }
  }

  selectTonnage() {
    this.selectedTonnage = this.tonnages.find(tonnage => {
      return tonnage.tonnage >= this.enteredTonnage;
    })
  }
}
