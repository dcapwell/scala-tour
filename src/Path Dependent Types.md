# Path Dependent Types
Path dependent types and dependent method types are a way to define relationships between types.  Lets go to an example.

## Fan fiction
In fan fiction, writers some times add characters from different franchises into the story.

```scala
object Franchise {
    case class Character(name: String)
}
class Franchise(name: String) {
    import Franchise.Character

    def createFanFiction(a: Character, b: Character) = (a, b)
}

val starTrek = new Franchise("Star Trek")
val starWars = new Franchise("Star Wars")

val quark = Franchise.Character("Quark")
val jadzia = Franchise.Character("Jadzia Dax")

val luke = Franchise.Character("Luke Skywalker")
val yoda = Franchise.Character("Yoda")

starTrek.createFanFiction(jadzia, luke)
```
This is wrong on so many levels, so lets see how we can block this!

### Take 1

```scala
object Franchise {
    case class Character(name: String, franchise: Franchise)
}
class Franchise(name: String) {
    import Franchise.Character

    def createFanFiction(a: Character, b: Character) = {
        require(a.franchise == b.franchise)
        (a, b)
    }
}

val starTrek = new Franchise("Star Trek")
val starWars = new Franchise("Star Wars")

val quark = Franchise.Character("Quark", starTrek)
val jadzia = Franchise.Character("Jadzia Dax", starTrek)

val luke = Franchise.Character("Luke Skywalker", starWars)
val yoda = Franchise.Character("Yoda", starWars)

// starTrek.createFanFiction(jadzia, luke) // throws runtime exception
```

Great!  We are now able to stop the madness!  We fail fast when the user tries to create the fan fiction, but could we do better?  Could we fail at compile time?

### Take 2

```scala
class Franchise(name: String) {
    case class Character(name: String)

    def createFanFiction(a: Character, b: Character) = (a, b)
}

val starTrek = new Franchise("Star Trek")
val starWars = new Franchise("Star Wars")

val quark = starTrek.Character("Quark")
val jadzia = starTrek.Character("Jadzia Dax")

val luke = starWars.Character("Luke Skywalker")
val yoda = starWars.Character("Yoda")

// starTrek.createFanFiction(quark, luke)
// error: type mismatch;
//  found   : starWars.Character
//  required: starTrek.Character
//               starTrek.createFanFiction(quark, luke)
//                                                ^
```

This is great!  Now we can block these ungodly sins while still allowing the fans to create fiction within a single franchise.

```scala
starTrek.createFanFiction(quark, jadzia)
```

Lets explore that exception a bit more.

```scala
starTrek.createFanFiction(quark, luke)
error: type mismatch;
 found   : starWars.Character
 required: starTrek.Character
              starTrek.createFanFiction(quark, luke)
```

As we see from the type mismatch statement, we found type `starWars.Character` but we required `starTrek.Character`.  The type of each `Character` is dependent on the path that it was created from, in this case the `starWars` and `starTrek` objects.

Can we take this idea further?

## Dependent Method Types
Lets say that the `createFanFiction` function is not a method on a `Franchise` instance, then how can we do the above example?

```scala
def createFanFiction(f: Franchise)(a: f.Character, b: f.Character) = (a, b)

createFanFiction(starTrek)(jadzia, quark)
// createFanFiction(starTrek)(jadzia, luke) // won't compile, type mismatch
```

## Pulling it together
Fan fiction is great and all (as long as they don't cross the streams), but lets use a more relistic example: `KeyValue` databases.

```scala
object KeyValue {
    abstract class Key(name: String) {
        type Value
    }
    var db = collection.mutable.Map.empty[Key, Any]

    def get(key: Key): Option[key.Value] = db.get(key).asInstanceOf[Option[key.Value]]
    def set(key: Key)(value: key.Value): Unit = db.update(key, value)
}

import KeyValue._

trait IntValued extends Key {
    type Value = Int
}

trait StringValued extends Key {
    type Value = String
}

val foo = new Key("foo") with IntValued
val bar = new Key("bar") with StringValued

KeyValue.set(foo)(1)
KeyValue.get(foo).get

// KeyValue.set(bar)(1)
// error: type mismatch;
//  found   : Int(1)
//  required: bar.Value
//     (which expands to)  String
//               KeyValue.set(bar)(1)
```
