# Ascension
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdchaebae%2FAscension.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdchaebae%2FAscension?ref=badge_shield)


[Ascension](http://ascension426.azurewebsites.net) is a Spring 2018 COS426 (Computer Graphics) Final Project that features various filters/convolutions, raycasting, and collision schemes. It is a escape-the-prison type game in which the player must escape to the exit without getting caught by the guards. If you read the files, you will find that the player is named Lazuli (named after Lapis jewel). This project was created by Daniel Chae, Annie Chen, and Thomas Colen. We hope you enjoy the experience!

In order to run, you must have >=Python 3.x and Flask. Install Flask using pip
```bash
pip install Flask
```

To make additional maps, run the local python server
```bash
python -m http.server
```
and navigate to mapmaker.html. This can be used to draw maps and generate JSON immediately.

To run the game locally, simply run the following commands after installing Flask.
```bash
export FLASK_APP=main.py
flask run
```
You only need to run export command only once.

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fdchaebae%2FAscension.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fdchaebae%2FAscension?ref=badge_large)