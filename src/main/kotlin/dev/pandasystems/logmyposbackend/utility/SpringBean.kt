package dev.pandasystems.logmyposbackend.utility

import org.springframework.beans.factory.getBean
import org.springframework.context.ApplicationContext
import org.springframework.stereotype.Component
import kotlin.properties.ReadOnlyProperty

@Component
class SpringContext(context: ApplicationContext) {
	init {
		Companion.context = context
	}

	companion object {
		lateinit var context: ApplicationContext
	}
}

inline fun <reified T> springBean(): ReadOnlyProperty<Any?, T> = ReadOnlyProperty { _, _ ->
	SpringContext.context.getBean(T::class.java)
}