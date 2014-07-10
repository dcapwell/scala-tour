# Scala Version Differences
Since macros are experimental, changes have come up between scala 2.10 and 2.11.  This section will go over the differences.

## 2.10
In 2.10, the way you access `Context` is by using `import scala.reflect.macros.Context`.  This gives you all the tree operations covered in the sections later, but introduces a function `reify` which generates `c.Expr` instances based off a block of code.

## 2.11
2.11 introduced big changes for how macros are built.

  * `scala.reflect.macros.Context` has been split in two
    *  `scala.reflect.macros.blackbox.Context`
    *  `scala.reflect.macros.whitebox.Context`
  * `reify` is not the only way to create trees
    * `q""" println("Hello World!") """`

### Colored Boxes
`scala.reflect.macros.Context` still exists in 2.11, but its being replaced by two new `Context` types found in blackbox and whitebox.  If you look at the code, `whitebox.Context` extends from `blackbox.Context`, so what can whitebox do that blackbox cant?  The main difference is that blackbox macros should act just like normal functions (`A => B`) but whitebox macros can refine their return type.  What this means is that whitebox macros can change their return type.

A example of when you would use whitebox over blackbox is a function that converts a case class into a tuple of the same size.

```scala
def toTuple[A <: Product](a: A): Any = macro CaseClassMacros.toTupleMacro[A]
```

In this example, calling it as `toTuple(Foo("foo", "bar"))` yields `(String, String)` as the return type.  A good writeup on this can be found [here](http://docs.scala-lang.org/overviews/macros/blackbox-whitebox.html).

Use whitebox macros with caution since IDE support is very limited (aka, intellij says that your code doesn't compile, but it typechecks!).  A common workaround for such a thing is by throwing an abstraction/typeclass over this function...

#### Implicit Macros
Since functions can be macros, and implicits can be used with functions... see where I am going with this?  Yep, implicit macro calls!

A common pattern of hiding that you are really using macros is by defining a typeclass that does what the user wants (`CaseToTuple`), but the creation of the typeclass instance is via a macro.

```scala
implicit def caseToTuple[C,T]: CaseToTuple[C, T] = macro ...
```

This makes the user API clean since its defering the real whitebox stuff internally; it encapsulates the real macro.

### q""" Quasiquotes? """
With 2.11 (and macro paradise) comes a new way to build up trees; quasiquotes!  Quasiquotes are really just string interpolation but generates `c.universe.Tree` instances.

Simple example of quasiquotes:

```scala
q"""
 case class MacroGenClass(name: String)
 val mgc = MacroGenClass("some name!")
"""
```

This will generate a `Block` that has the `ClassDef` and `ValDef` calls, and return `Unit`.

Quasiquotes are your new best friend!
