# Object Init

There are some weird cases in java, where the code looks like it will init properly, but won't.  This happens more often in scala and can be hard to understand.

## Vals in Traits

Lets define a simple trait that requires a val to be defined.  This trait will then use it on construction.

```scala
trait Foo {
    val a: Int

    println(s"Value of a is $a")
}
```

Now, lets create the foo object

```scala
new Foo {
    val a: Int = 12

    println(s"In extending type: $a")
}
```

vs

```scala
class FooImpl(val a: Int) extends Foo {
    println(s"In extending type: $a")
}
new FooImpl(12)
```

vs

```scala
class Foo2Impl(val b: Int) extends Foo {
    val a = b

    println(s"In extending type: $a")
}
new Foo2Impl(12)
```

vs

```scala
class Foo3Impl(val b: Int) extends Foo {
    override val a = b

    println(s"In extending type: $a")
}
new Foo3Impl(12)
```

What do you think the output will be?  Lets find out.

```scala
scala> trait Foo {
     |     val a: Int
     |
     |     println(s"Value of a is $a")
     | }
defined trait Foo

scala> new Foo {
     |     val a: Int = 12
     |
     |     println(s"In extending type: $a")
     | }
Value of a is 0
In extending type: 12
res0: Foo = $anon$1@661a642b

scala> class FooImpl(val a: Int) extends Foo {
     |     println(s"In extending type: $a")
     | }
defined class FooImpl

scala> new FooImpl(12)
Value of a is 12
In extending type: 12
res1: FooImpl = FooImpl@27a7a9f

scala> class Foo2Impl(val b: Int) extends Foo {
     |     val a = b
     |
     |     println(s"In extending type: $a")
     | }
defined class Foo2Impl

scala> new Foo2Impl(12)
Value of a is 0
In extending type: 12
res2: Foo2Impl = Foo2Impl@70ff4bfb

scala> class Foo3Impl(val b: Int) extends Foo {
     |     override val a = b
     |
     |     println(s"In extending type: $a")
     | }
defined class Foo3Impl

scala> new Foo3Impl(12)
Value of a is 0
In extending type: 12
res3: Foo3Impl = Foo3Impl@2123dde6
```

So, the output is 0, 12, 0, then 0 again?  Why is this?  When init is called for a super class/trait the parent constructor is done before the first line of the extending type (but after class definition).  Also with override, you would have assumed that the output was 12 12, but it was like the others (0, 12).  This is because how the compiler treats override vals: they are only initialized at the call site and not propgated lower.  What does this mean?  It means that if foo had a default that was non 0, the output would not change!

```scala
trait Bar {
    val bar: String = "default"

    println(s"Base: $bar")
}

new Bar {
    override val bar: String = "top"

    println(s"Top: $bar")
}
// output
// Base: null
// Top: top

class Bar1(b: String) extends Bar {
    override val bar: String = b

    println(s"Top: $bar")
}
new Bar1("top")
// output
// Base: null
// Top: top

class Bar2(bar: String) extends Bar {
    println(s"Top: $bar")
}
new Bar2("top")
// output
// Base: default
// Top: top

class Bar3(override val bar: String) extends Bar {
    println(s"Top: $bar")
}
new Bar3("top")
// output
// Base: top
// Top: top
```

The above is what was meant by the value is defined at the call site but not lower down.  When the type overrides a val, only at that level will it be evaluated.  The base types will be given a null value (or 0 for numbers).  To avoid these kinds of bugs, try to avoid vals in traits; will save you time trying to figure out how a null snuck in.
