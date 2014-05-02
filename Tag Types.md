# Tag Types
In default scala, we have a way to alias types.

```scala
type Foo = String
```

This is great as a way to make code more readable, but if your type logically has a more limited range of support then the type won't enforce this.  Or if the type you are working with is used in different places to mean different things, then implicits wont know what to pick.

Limited range of support:

```scala
type KiloGram = Int
def someWorkWithKiloGrams(value: KiloGram): KiloGram
someWorkWithKiloGrams(Integer.MIN_VALUE)
```

Scalaz provides a way to `Tag` these types.  What is tagging?  Its the act of creating a new type that has a reference to another type.  Lets look at the code for `KiloGram`.

```scala
import scalaz._, Scalaz._
sealed trait KiloGram
def KiloGram[A](a: A): A @@ KiloGram = Tag[A, KiloGram](a)
```

Here we define a sealed trait `KiloGram` as the type we want to annotation other types with.  We also define a `KiloGram` function that takes any type `A` and returns `A @@ KiloGram`.  This is a new type and not an alias to a type, so any time you use it with an `A` you must convert to the proper type.

```scala
def someWorkWithKiloGram(value: Int @@ KiloGram): Int @@ KiloGram = 
  KiloGram(value - 1)

someWorkWithKiloGram(KiloGram(10))
// 9: Int @@ KiloGram

someWorkWithKiloGram(10)
<console>:79: error: type mismatch;
 found   : Int(10)
 required: scalaz.@@[Int,KiloGram]
    (which expands to)  Int with AnyRef{type Tag = KiloGram}
              someWorkWithKiloGram(10)
                                   ^
```

This is nice because now each method can choose what base types they can work with, and still require callers to `Tag` the type before calling as a way to enforce that the values make sense.  The same can be accomplished with type aliases, but you could never enforce that a user must do work to use the type.  With `Tag`, you now make the user do work to tag the type before calling, making it more explicit to the caller.

So how does this work?

```scala
type Tagged[T] = {type Tag = T}
type @@[+T, Tag] = T with Tagged[Tag]

object Tag {
    @inline def apply[A, T](a: A): A @@ T = a.asInstanceOf[A @@ T]
}
```

When working with a tagged type, it really is just a cast to another type.  The fact that its inlined is nice so all conversions to `KiloGram` are just a cast and nothing more.

At the beginning, it was pointed out that tagging can be used to make implicits over similar types easier to work with.  Lets look at how this works.

Implicits over similar types:

```scala
import java.io.File
type PluginRepo = File
type ConfigRepo = File

def printConfigRepo(implicit repo: ConfigRepo): Unit = println(repo)

implicit val plugin: PluginRepo = new File("/tmp")
implicit val config: ConfigRepo = new File("/tmp")

printConfigRepo
<console>:71: error: ambiguous implicit values:
 both value plugin of type => PluginRepo
 and value config of type => ConfigRepo
 match expected type ConfigRepo
              printConfigRepo
              ^
```

Type alias fail us went working with implicits and same referenced type.  Now lets look at the same thing using tagged types.

```scala
sealed trait Owner
sealed trait Plugin extends Owner
sealed trait Config extends Owner

def Plugin[A](a: A): A @@ Plugin = Tag[A, Plugin](a)
def Config[A](a: A): A @@ Config = Tag[A, Config](a)
```

We first need to define the types to tag with and a function that will cast for us.  Once we have that we can use it.

```scala
def printConfigRepo(implicit repo: File @@ Config) = println(repo)

implicit val config = Config(new File("/tmp/config"))

printConfigRepo
// /tmp/config
```

Great, works just as expected, so now lets see if adding a `Plugin` file breaks this.

```scala
implicit val plugin = Plugin(new File("/tmp/plugin"))

printConfigRepo
// /tmp/config
```

Great!  Adding the `Plugin` implict doesn't break the `Config` code.

So what are the main differences between type aliases and tagged types?  A type alias is just that, an alias that the compiler knows about.  To the compiler `PluginRepo` is no different than `File`.  A tagged type is a brand new type that is saying `File with Plugin`.  The generated type is-a `File`, but its also a `Plugin`.  In order to do this you do need to cast the object to this type.  So the main difference at runtime is that alias doesn't have any effects at runtime where as tagged types require a cast.
