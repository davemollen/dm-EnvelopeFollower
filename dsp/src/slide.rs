pub struct Slide {
  z: f32,
}

impl Slide {
  pub fn new() -> Self {
    Self { z: 0. }
  }

  pub fn reset(&mut self) {
    self.z = 0.;
  }

  pub fn process(&mut self, input: f32, rise_factor: f32, fall_factor: f32) -> f32 {
    let difference = input - self.z;
    if difference.abs() <= f32::EPSILON {
      self.z = input;
    } else {
      self.z += difference
        * if input > self.z {
          rise_factor
        } else {
          fall_factor
        };
    }
    self.z
  }
}
